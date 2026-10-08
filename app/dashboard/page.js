"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  applyTheme,
  getThemeOptions,
  THEME_STORAGE_KEY as THEME_STORAGE,
} from "../lib/themes";
import PreviewPanel from "./_components/preview-panel";
import ProfileEditor from "./_components/profile-editor";
import ProjectsManager from "./_components/projects-manager";

const PROFILE_STORAGE_KEY = "portfolio-forge-profile-draft";
const PROFILE_CHANGE_EVENT = "portfolio-profile-change";
const PROJECTS_STORAGE_KEY = "portfolio-forge-github-projects";
const GITHUB_DATA_STORAGE_KEY = "portfolio-forge-github-data";
const GITHUB_DATA_CHANGE_EVENT = "portfolio-github-data-change";
const THEME_CHANGE_EVENT = "portfolio-theme-change";

const defaultProfile = {
  name: "",
  role: "",
  shortBio: "",
  email: "",
};

const DEFAULT_PROFILE_SNAPSHOT = JSON.stringify(defaultProfile);

function getProfileSnapshot() {
  return (
    window.localStorage.getItem(PROFILE_STORAGE_KEY) ||
    DEFAULT_PROFILE_SNAPSHOT
  );
}

function getServerProfileSnapshot() {
  return DEFAULT_PROFILE_SNAPSHOT;
}

function subscribeToProfile(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PROFILE_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PROFILE_CHANGE_EVENT, onChange);
  };
}

function parseProfileSnapshot(snapshot) {
  try {
    const parsedProfile = JSON.parse(snapshot);
    if (!parsedProfile || typeof parsedProfile !== "object") {
      throw new Error("Saved profile draft is not an object.");
    }

    return {
      name: typeof parsedProfile.name === "string" ? parsedProfile.name : "",
      role: typeof parsedProfile.role === "string" ? parsedProfile.role : "",
      shortBio:
        typeof parsedProfile.shortBio === "string"
          ? parsedProfile.shortBio
          : "",
      email: typeof parsedProfile.email === "string" ? parsedProfile.email : "",
    };
  } catch (error) {
    console.error("Could not load saved profile draft:", error);
    return defaultProfile;
  }
}

function saveProfile(update) {
  const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  const currentProfile = savedProfile
    ? parseProfileSnapshot(savedProfile)
    : defaultProfile;
  const nextProfile =
    typeof update === "function" ? update(currentProfile) : update;

  window.localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(nextProfile),
  );
  window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
}

function getGithubDataSnapshot() {
  return window.localStorage.getItem(GITHUB_DATA_STORAGE_KEY) || "null";
}

function getServerGithubDataSnapshot() {
  return "null";
}

function subscribeToGithubData(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(GITHUB_DATA_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(GITHUB_DATA_CHANGE_EVENT, onChange);
  };
}

function parseGithubDataSnapshot(snapshot) {
  if (snapshot === "null") return null;
  try {
    const parsedData = JSON.parse(snapshot);
    if (
      !parsedData?.user ||
      typeof parsedData.user.login !== "string" ||
      !Array.isArray(parsedData.repositories)
    ) {
      throw new Error("Saved GitHub data has an invalid format.");
    }

    return parsedData;
  } catch (error) {
    console.error("Could not load cached GitHub data:", error);
    return null;
  }
}

function saveGithubData(data) {
  try {
    window.localStorage.setItem(GITHUB_DATA_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(GITHUB_DATA_CHANGE_EVENT));
  } catch (error) {
    console.error("Could not cache GitHub data:", error);
  }
}

function clearGithubData() {
  try {
    window.localStorage.removeItem(GITHUB_DATA_STORAGE_KEY);
    window.dispatchEvent(new Event(GITHUB_DATA_CHANGE_EVENT));
  } catch (error) {
    console.error("Could not clear cached GitHub data:", error);
  }
}

function getThemeSnapshot() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE);
  return getThemeOptions().some((theme) => theme.value === savedTheme)
    ? savedTheme
    : "purple";
}

function getServerThemeSnapshot() {
  return "purple";
}

function subscribeToTheme(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function saveTheme(theme) {
  window.localStorage.setItem(THEME_STORAGE, theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export default function DashboardPage() {
  const router = useRouter();
  const profileSnapshot = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );
  const profile = useMemo(
    () => parseProfileSnapshot(profileSnapshot),
    [profileSnapshot],
  );
  const updateProfile = useCallback((update) => saveProfile(update), []);
  const [saveStatus, setSaveStatus] = useState("");
  const [publishedSlug, setPublishedSlug] = useState("");
  const selectedTheme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [githubState, setGithubState] = useState("loading");
  const githubDataSnapshot = useSyncExternalStore(
    subscribeToGithubData,
    getGithubDataSnapshot,
    getServerGithubDataSnapshot,
  );
  const githubData = useMemo(
    () => parseGithubDataSnapshot(githubDataSnapshot),
    [githubDataSnapshot],
  );
  const githubUser = githubData?.user ?? null;
  const repositories = githubData?.repositories ?? [];
  const showRepositoryManager =
    githubState === "connected" ||
    ((githubState === "loading" || githubState === "error") &&
      githubData !== null);
  const [selectedProjects, setSelectedProjects] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const savedProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
      const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];
      return Array.isArray(parsedProjects) ? parsedProjects : [];
    } catch {
      return [];
    }
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const themes = useMemo(() => getThemeOptions(), []);

  useEffect(() => {
    window.localStorage.setItem(
      PROJECTS_STORAGE_KEY,
      JSON.stringify(selectedProjects),
    );
  }, [selectedProjects]);

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
          clearGithubData();
          setGithubState("disconnected");
          return;
        }

        if (response.status === 503) {
          clearGithubData();
          setGithubState("not-configured");
          return;
        }

        if (!response.ok) throw new Error(data.error);

        const nextGithubData = {
          user: data.user,
          repositories: data.repositories,
        };
        saveGithubData(nextGithubData);
        if (data.user) {
          updateProfile((currentProfile) => ({
            ...currentProfile,
            name: currentProfile.name || data.user.name || data.user.login || "",
            shortBio: currentProfile.shortBio || data.user.bio || "",
            email: currentProfile.email || data.user.email || "",
          }));
        }
        setGithubState("connected");
      } catch {
        if (isCurrent) setGithubState("error");
      }
    }

    loadRepositories();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey, updateProfile]);

  function handleProfileChange(e) {
    const { name, value } = e.target;
    updateProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
    setSaveStatus("");
  }

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  // Sačuvani portfolio popunjava samo ono što u ovom pregledaču još nije uneto.
  useEffect(() => {
    if (githubState !== "connected") return;
    let isCurrent = true;

    async function loadSavedPortfolio() {
      try {
        const response = await fetch("/api/portfolio", { cache: "no-store" });
        if (!response.ok) return;

        const { portfolio } = await response.json();
        if (!portfolio || !isCurrent) return;

        const saved = portfolio.profile ?? {};
        updateProfile((current) => ({
          name: current.name || saved.name || "",
          role: current.role || saved.role || "",
          shortBio: current.shortBio || saved.shortBio || "",
          email: current.email || saved.email || "",
        }));
        setSelectedProjects((current) =>
          current.length ? current : (portfolio.selected_projects ?? []),
        );
        if (
          !window.localStorage.getItem(THEME_STORAGE) &&
          getThemeOptions().some((theme) => theme.value === portfolio.theme)
        ) {
          saveTheme(portfolio.theme);
        }
      } catch (error) {
        console.error("Could not load saved portfolio:", error);
      }
    }

    loadSavedPortfolio();
    return () => {
      isCurrent = false;
    };
  }, [githubState, updateProfile]);

  function handleSaveDraft() {
    saveProfile(profile);
    setSaveStatus("Draft profile je sačuvan.");
  }

  async function handlePublish() {
    saveProfile(profile);
    setSaveStatus("Čuvanje portfolija...");
    setPublishedSlug("");

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

  function handlePreviewPublicUrl() {
    saveProfile(profile);
    window.localStorage.setItem(
      PROJECTS_STORAGE_KEY,
      JSON.stringify(selectedProjects),
    );
    router.push("/preview");
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
  }

  function updateProjectDescription(projectId, description) {
    setSelectedProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? { ...project, portfolioDescription: description }
          : project,
      ),
    );
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
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>Portfolio Forge</strong>
            <span>Creator Dashboard</span>
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link className="active" href="#overview">
            Overview
          </Link>
          <Link href="#profile">Profile</Link>
          <Link href="#projects">Projects</Link>
          <Link href="#theme">Theme</Link>
          <Link href="#publish">Publish</Link>
        </nav>

        <div className="plan-card">
          <p className="section-kicker">Free Plan</p>
          <h3>1 active portfolio</h3>
          <p>
            Upgrade to Pro for custom domain, analytics, and more templates.
          </p>
          <button type="button" className="button button-primary">
            Upgrade to Pro
          </button>
        </div>
      </aside>

      <section className="dashboard-main" id="overview">
        <header className="dashboard-header">
          <div>
            <p className="section-kicker">Portfolio editor</p>
            <h1>Design your portfolio like a product page</h1>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleSaveDraft}
            >
              Save draft
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={handlePublish}
            >
              Publish
            </button>
          </div>
        </header>

        {saveStatus ? (
          <p className="save-status">
            {saveStatus}{" "}
            {publishedSlug ? (
              <a
                href={`/u/${publishedSlug}`}
                target="_blank"
                rel="noreferrer"
              >
                /u/{publishedSlug}
              </a>
            ) : null}
          </p>
        ) : null}

        <div className="dashboard-grid">
          <ProfileEditor profile={profile} onChange={handleProfileChange} />
          <ProjectsManager
            githubState={githubState}
            githubData={githubData}
            githubUser={githubUser}
            repositories={repositories}
            showRepositoryManager={showRepositoryManager}
            selectedProjects={selectedProjects}
            onRefresh={() => setRefreshKey((key) => key + 1)}
            onToggleProject={toggleProject}
            onMoveProject={moveProject}
            onUpdateDescription={updateProjectDescription}
          />
        </div>
      </section>

      <PreviewPanel
        profile={profile}
        themes={themes}
        selectedTheme={selectedTheme}
        onPreview={handlePreviewPublicUrl}
        onSelectTheme={saveTheme}
      />
    </main>
  );
}
