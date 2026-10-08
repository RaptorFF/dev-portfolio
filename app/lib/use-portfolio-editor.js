"use client";

import { useEffect, useRef, useState } from "react";

const defaultProfile = {
  name: "",
  role: "",
  shortBio: "",
  email: "",
};

const text = (value) => (typeof value === "string" ? value : "");

export function usePortfolioEditor({ themes, selectedTheme, saveTheme }) {
  const [profile, setProfile] = useState(defaultProfile);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [githubData, setGithubData] = useState(null);
  const [githubState, setGithubState] = useState("loading");
  const [saveStatus, setSaveStatus] = useState("");
  const [publishedSlug, setPublishedSlug] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const portfolioLoaded = useRef(false);

  const githubUser = githubData?.user ?? null;
  const repositories = githubData?.repositories ?? [];
  const showRepositoryManager =
    githubState === "connected" ||
    ((githubState === "loading" || githubState === "error") &&
      githubData !== null);

  useEffect(() => {
    let isCurrent = true;

    // Sačuvani portfolio iz Supabase-a se učitava samo jednom, da osvežavanje
    // liste repozitorijuma ne pregazi izmene koje još nisu objavljene.
    async function loadSavedPortfolio(user) {
      let portfolio = null;

      try {
        const response = await fetch("/api/portfolio", { cache: "no-store" });
        if (response.ok) portfolio = (await response.json()).portfolio;
      } catch (error) {
        console.error("Could not load saved portfolio:", error);
      }

      if (!isCurrent) return;
      portfolioLoaded.current = true;

      const saved = portfolio?.profile ?? {};
      setProfile({
        name: text(saved.name) || user?.name || user?.login || "",
        role: text(saved.role),
        shortBio: text(saved.shortBio) || user?.bio || "",
        email: text(saved.email) || user?.email || "",
      });

      if (!portfolio) return;

      setSelectedProjects(portfolio.selected_projects ?? []);
      setPublishedSlug(portfolio.slug);
      if (themes.some((theme) => theme.value === portfolio.theme)) {
        saveTheme(portfolio.theme);
      }
    }

    async function loadRepositories() {
      setGithubState("loading");

      try {
        const response = await fetch("/api/github/repos", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!isCurrent) return;

        if (response.status === 401) {
          setGithubData(null);
          setGithubState("disconnected");
          return;
        }

        if (response.status === 503) {
          setGithubData(null);
          setGithubState("not-configured");
          return;
        }

        if (!response.ok) throw new Error(data.error);

        setGithubData({ user: data.user, repositories: data.repositories });
        setGithubState("connected");

        if (!portfolioLoaded.current) await loadSavedPortfolio(data.user);
      } catch {
        if (isCurrent) setGithubState("error");
      }
    }

    loadRepositories();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey, themes, saveTheme]);

  function updateProfileField(e) {
    const { name, value } = e.target;
    setProfile((currentProfile) => ({ ...currentProfile, [name]: value }));
    setSaveStatus("");
  }

  async function publish() {
    setSaveStatus("Čuvanje portfolija...");

    try {
      const response = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: selectedTheme,
          profile,
          selectedProjects,
        }),
      });
      const data = await response.json();

      if (response.status === 401) {
        setSaveStatus("Poveži GitHub da bi sačuvao portfolio.");
        return;
      }
      if (response.status === 503) {
        setSaveStatus("Supabase nije podešen. Proveri .env.local.");
        return;
      }
      if (!response.ok) throw new Error(data.error);

      setSaveStatus("Portfolio je objavljen:");
      setPublishedSlug(data.slug);
    } catch {
      setSaveStatus("Čuvanje nije uspelo. Pokušaj ponovo.");
    }
  }

  function toggleProject(repository) {
    setSelectedProjects((currentProjects) => {
      const alreadySelected = currentProjects.some(
        (project) => project.id === repository.id,
      );

      if (alreadySelected) {
        return currentProjects.filter(
          (project) => project.id !== repository.id,
        );
      }

      return [
        ...currentProjects,
        { ...repository, portfolioDescription: repository.description || "" },
      ];
    });
    setSaveStatus("");
  }

  function updateProjectDescription(projectId, description) {
    setSelectedProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? { ...project, portfolioDescription: description }
          : project,
      ),
    );
    setSaveStatus("");
  }

  function moveProject(projectIndex, direction) {
    setSelectedProjects((currentProjects) => {
      const targetIndex = projectIndex + direction;
      if (targetIndex < 0 || targetIndex >= currentProjects.length) {
        return currentProjects;
      }

      const reorderedProjects = [...currentProjects];
      [reorderedProjects[projectIndex], reorderedProjects[targetIndex]] = [
        reorderedProjects[targetIndex],
        reorderedProjects[projectIndex],
      ];
      return reorderedProjects;
    });
    setSaveStatus("");
  }

  return {
    profile,
    selectedProjects,
    githubData,
    githubUser,
    githubState,
    repositories,
    showRepositoryManager,
    saveStatus,
    publishedSlug,
    refresh: () => setRefreshKey((key) => key + 1),
    updateProfileField,
    publish,
    toggleProject,
    updateProjectDescription,
    moveProject,
  };
}
