"use client";

import { useEffect, useRef, useState } from "react";

// Custom hook for managing the portfolio editor state.

const defaultProfile = {
  name: "",
  role: "",
  shortBio: "",
  email: "",
  avatarUrl: "",
  avatarImage: "",
  skills: [],
  experience: [],
  education: [],
  links: {
    github: "",
    linkedin: "",
    website: "",
  },
};

const text = (value) => (typeof value === "string" ? value : "");
const list = (value) => (Array.isArray(value) ? value : []);

export function usePortfolioEditor({ themes, selectedTheme, saveTheme }) {
  const [profile, setProfile] = useState(defaultProfile);
  const [skillsText, setSkillsText] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loadedGithubData, setGithubData] = useState(null);
  const [loadedGithubState, setGithubState] = useState("loading");
  const [saveStatus, setSaveStatus] = useState("");
  const [publishedSlug, setPublishedSlug] = useState("");
  const [slug, setSlug] = useState("");
  const [authState, setAuthState] = useState("loading");
  const [refreshKey, setRefreshKey] = useState(0);
  const [portfolioLoaded, setPortfolioLoaded] = useState(false);
  const [session, setSession] = useState(null);
  const prefilledFor = useRef(null);

  // /api/auth/session always returns 200, so anonymous users do not trigger a 401.
  useEffect(() => {
    let isCurrent = true;

    async function loadSession() {
      let next = { authenticated: false, hasGithub: false, avatarUrl: "" };

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const data = response.ok ? await response.json() : null;
        if (data?.user) {
          next = {
            authenticated: true,
            hasGithub: Boolean(data.hasGithub),
            avatarUrl: text(data.user?.image),
          };
        }
      } catch (error) {
        console.error("Could not load session:", error);
      }

      if (isCurrent) setSession(next);
    }

    loadSession();
    return () => {
      isCurrent = false;
    };
  }, []);

  const githubUnavailable = session !== null && !session.hasGithub;
  const githubData = githubUnavailable ? null : loadedGithubData;
  const githubState = githubUnavailable ? "disconnected" : loadedGithubState;

  const githubUser = githubData?.user ?? null;
  const repositories = githubData?.repositories ?? [];
  const showRepositoryManager =
    githubState === "connected" ||
    ((githubState === "loading" || githubState === "error") &&
      githubData !== null);

  // The saved portfolio is loaded only once and does not depend on GitHub, so refreshing
  // the repository list does not overwrite changes that have not yet been published.
  useEffect(() => {
    if (!session) return;
    let isCurrent = true;

    async function loadSavedPortfolio() {
      let portfolio = null;
      let status = session.authenticated ? "authenticated" : "anonymous";

      try {
        if (session.authenticated) {
          const response = await fetch("/api/portfolio", { cache: "no-store" });
          if (response.status === 401) status = "anonymous";
          else if (response.status === 503) status = "not-configured";
          else if (response.ok) portfolio = (await response.json()).portfolio;
        }
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
        avatarUrl: session.avatarUrl || text(saved.avatarUrl),
        avatarImage: text(saved.avatarImage),
        skills: list(saved.skills).filter((skill) => typeof skill === "string"),
        experience: list(saved.experience),
        education: list(saved.education),
        links: {
          ...defaultProfile.links,
          ...(saved.links && typeof saved.links === "object"
            ? saved.links
            : {}),
        },
      });
      setSkillsText(
        list(saved.skills)
          .filter((skill) => typeof skill === "string")
          .join(", "),
      );
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
  }, [session, themes, saveTheme]);

  // GitHub data only fills in empty profile fields.
  useEffect(() => {
    if (!portfolioLoaded || !githubUser) return;
    if (prefilledFor.current === githubUser.login) return;
    prefilledFor.current = githubUser.login;

    setProfile((current) => ({
      ...current,
      name: current.name || githubUser.name || githubUser.login || "",
      role: current.role,
      shortBio: current.shortBio || githubUser.bio || "",
      email: current.email || githubUser.email || "",
      avatarUrl: current.avatarImage
        ? current.avatarUrl
        : githubUser.avatarUrl || current.avatarUrl,
      links: {
        ...current.links,
        github:
          current.links.github || `https://github.com/${githubUser.login}`,
      },
    }));
  }, [portfolioLoaded, githubUser]);

  useEffect(() => {
    if (!session?.hasGithub) return;

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
  }, [session, refreshKey]);

  function updateProfileField(e) {
    const { name, value } = e.target;
    setProfile((currentProfile) => ({ ...currentProfile, [name]: value }));
    setSaveStatus("");
  }

  function updateAvatar(avatarImage) {
    setProfile((currentProfile) => ({ ...currentProfile, avatarImage }));
    setSaveStatus("");
  }

  function removeAvatar() {
    setProfile((currentProfile) => ({ ...currentProfile, avatarImage: "" }));
    setSaveStatus("");
  }

  function updateProfileEntry(collection, index, e) {
    const { name, value } = e.target;
    setProfile((currentProfile) => ({
      ...currentProfile,
      [collection]: list(currentProfile[collection]).map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [name]: value } : entry,
      ),
    }));
    setSaveStatus("");
  }

  function addProfileEntry(collection) {
    const entry =
      collection === "experience"
        ? { role: "", company: "", period: "", description: "" }
        : { degree: "", school: "", period: "", description: "" };
    setProfile((currentProfile) => ({
      ...currentProfile,
      [collection]: [...list(currentProfile[collection]), entry],
    }));
    setSaveStatus("");
  }

  function removeProfileEntry(collection, index) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [collection]: list(currentProfile[collection]).filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    }));
    setSaveStatus("");
  }

  function updateSocialLink(e) {
    const { name, value } = e.target;
    setProfile((currentProfile) => ({
      ...currentProfile,
      links: { ...currentProfile.links, [name]: value },
    }));
    setSaveStatus("");
  }

  function updateSkills(e) {
    const value = e.target.value;
    const skills = value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 30);
    setSkillsText(value);
    setProfile((currentProfile) => ({ ...currentProfile, skills }));
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
          skillsText,
          selectedProjects,
          slug: effectiveSlug,
        }),
      });
      const data = await response.json();

      if (response.status === 401) {
        setSaveStatus(
          data.error === "github_authorization_expired"
            ? "GitHub autorizacija je istekla. Klikni Reconnect GitHub, pa ponovo objavi."
            : "Prijavi se da bi sačuvao portfolio.",
        );
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

      if (Array.isArray(data.previews)) {
        const previewsById = new Map(data.previews.map((p) => [p.id, p]));
        setSelectedProjects((currentProjects) =>
          currentProjects.map((project) => {
            const preview = previewsById.get(project.id);
            return preview
              ? {
                  ...project,
                  cachedPreview: preview.cachedPreview,
                  cachedPreviewSource: preview.cachedPreviewSource,
                  refreshPreview: false,
                }
              : project;
          }),
        );
      }

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
        previewImage: project.previewImage || "",
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

  function updateProjectPreviewImage(projectId, previewImage) {
    setSelectedProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId ? { ...project, previewImage } : project,
      ),
    );
    setSaveStatus("");
  }

  function requestPreviewRefresh(projectId) {
    setSelectedProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? { ...project, refreshPreview: true }
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
    skillsText,
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
    updateProjectPreviewImage,
    requestPreviewRefresh,
    removeProject,
    refresh: () => setRefreshKey((key) => key + 1),
    updateProfileField,
    updateAvatar,
    removeAvatar,
    updateSkills,
    updateProfileEntry,
    addProfileEntry,
    removeProfileEntry,
    updateSocialLink,
    publish,
    toggleProject,
    updateProjectDescription,
    moveProject,
  };
}
