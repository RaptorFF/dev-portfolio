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
  const [slug, setSlug] = useState("");
  const [authState, setAuthState] = useState("loading");
  const [refreshKey, setRefreshKey] = useState(0);
  const [portfolioLoaded, setPortfolioLoaded] = useState(false);
  const prefilledFor = useRef(null);

  const githubUser = githubData?.user ?? null;
  const repositories = githubData?.repositories ?? [];
  const showRepositoryManager =
    githubState === "connected" ||
    ((githubState === "loading" || githubState === "error") &&
      githubData !== null);

  // Sačuvani portfolio se učitava samo jednom i ne zavisi od GitHub-a, da osvežavanje
  // liste repozitorijuma ne pregazi izmene koje još nisu objavljene.
  useEffect(() => {
    let isCurrent = true;

    async function loadSavedPortfolio() {
      let portfolio = null;
      let status = "authenticated";

      try {
        const response = await fetch("/api/portfolio", { cache: "no-store" });
        if (response.status === 401) status = "anonymous";
        else if (response.status === 503) status = "not-configured";
        else if (response.ok) portfolio = (await response.json()).portfolio;
      } catch (error) {
        console.error("Could not load saved portfolio:", error);
      }

      if (!isCurrent) return;

      const saved = portfolio?.profile ?? {};
      setProfile({
        name: text(saved.name),
        role: text(saved.role),
        shortBio: text(saved.shortBio),
        email: text(saved.email),
      });
      setAuthState(status);

      if (portfolio) {
        setSelectedProjects(portfolio.selected_projects ?? []);
        setPublishedSlug(portfolio.slug);
        setSlug(portfolio.slug);
        if (themes.some((theme) => theme.value === portfolio.theme)) {
          saveTheme(portfolio.theme);
        }
      }

      setPortfolioLoaded(true);
    }

    loadSavedPortfolio();
    return () => {
      isCurrent = false;
    };
  }, [themes, saveTheme]);

  // GitHub podaci samo popunjavaju prazna polja profila.
  useEffect(() => {
    if (!portfolioLoaded || !githubUser) return;
    if (prefilledFor.current === githubUser.login) return;
    prefilledFor.current = githubUser.login;

    setProfile((current) => ({
      name: current.name || githubUser.name || githubUser.login || "",
      role: current.role,
      shortBio: current.shortBio || githubUser.bio || "",
      email: current.email || githubUser.email || "",
    }));
  }, [portfolioLoaded, githubUser]);

  useEffect(() => {
    let isCurrent = true;

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

      } catch {
        if (isCurrent) setGithubState("error");
      }
    }

    loadRepositories();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

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
          slug: effectiveSlug,
        }),
      });
      const data = await response.json();

      if (response.status === 401) {
        setSaveStatus("Prijavi se da bi sačuvao portfolio.");
        return;
      }
      if (response.status === 400 && data.error === "invalid_slug") {
        setSaveStatus(
          "Adresa mora imati 3-30 znakova: mala slova, brojeve i crtice.",
        );
        return;
      }
      if (response.status === 409) {
        setSaveStatus("Ta adresa je zauzeta. Izaberi drugu.");
        return;
      }
      if (response.status === 503) {
        setSaveStatus("Supabase nije podešen. Proveri .env.local.");
        return;
      }
      if (!response.ok) throw new Error(data.error);

      setSaveStatus("Portfolio je objavljen:");
      setPublishedSlug(data.slug);
      setSlug(data.slug);
    } catch {
      setSaveStatus("Čuvanje nije uspelo. Pokušaj ponovo.");
    }
  }

  // Predlog adrese iz imena (ili iz emaila), da korisnik ne mora ništa da smišlja.
  const suggestedSlug = (profile.name || profile.email.split("@")[0] || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  const effectiveSlug = slug || suggestedSlug;
  const [slugCheck, setSlugCheck] = useState({ slug: "", status: "idle" });

  // Provjera dostupnosti adrese uz kašnjenje, da se ne šalje zahtjev na svako slovo.
  useEffect(() => {
    if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(effectiveSlug)) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/slug-check?slug=${encodeURIComponent(effectiveSlug)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await response.json();
        setSlugCheck({
          slug: effectiveSlug,
          status: !response.ok
            ? "error"
            : data.available
              ? "available"
              : "taken",
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setSlugCheck({ slug: effectiveSlug, status: "error" });
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [effectiveSlug]);

  const slugStatus = !effectiveSlug
    ? "idle"
    : !/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(effectiveSlug)
      ? "invalid"
      : slugCheck.slug === effectiveSlug
        ? slugCheck.status
        : "checking";

  function updateSlug(value) {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    setSaveStatus("");
  }

  function addCustomProject(project) {
    setSelectedProjects((currentProjects) => [
      ...currentProjects,
      {
        id: `custom-${crypto.randomUUID()}`,
        name: project.name,
        portfolioDescription: project.description,
        htmlUrl: project.url,
        homepage: "",
        language: project.language,
        stars: 0,
      },
    ]);
    setSaveStatus("");
  }

  function removeProject(projectId) {
    setSelectedProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId),
    );
    setSaveStatus("");
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
    slug,
    suggestedSlug,
    slugStatus,
    canPublish:
      githubState === "connected" ||
      (slugStatus !== "taken" && slugStatus !== "invalid"),
    authState,
    canEditSlug: githubState !== "connected",
    updateSlug,
    addCustomProject,
    removeProject,
    refresh: () => setRefreshKey((key) => key + 1),
    updateProfileField,
    publish,
    toggleProject,
    updateProjectDescription,
    moveProject,
  };
}
