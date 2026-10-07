"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
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

  function handleSaveDraft() {
    saveProfile(profile);
    setSaveStatus("Draft profile je sačuvan.");
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

  const previewName = profile.name || "Your Name";
  const previewTitle = profile.role
    ? `${profile.role}`
    : "Your role will appear here";
  const previewBio =
    profile.shortBio ||
    "Add a short bio in Profile setup to preview your public portfolio.";

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
            <button type="button" className="button button-primary">
              Publish
            </button>
          </div>
        </header>

        {saveStatus ? <p className="save-status">{saveStatus}</p> : null}

        <div className="dashboard-grid">
          <article className="editor-card" id="profile">
            <h2>Profile setup</h2>
            <p className="github-status" role="status">
              When GitHub is connected, name and bio are filled in when
              available. GitHub profiles do not include a role, so add that
              manually.
            </p>
            <div className="mock-field">
              <label htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="e.g. Filip Frontend"
              />
            </div>
            <div className="mock-field">
              <label htmlFor="profile-role">Role</label>
              <textarea
                id="profile-role"
                name="role"
                value={profile.role}
                onChange={handleProfileChange}
                placeholder="e.g. Frontend Developer and Product Designer"
                rows={2}
              />
            </div>
            <div className="mock-field">
              <label htmlFor="profile-shortBio">Short bio</label>
              <textarea
                id="profile-shortBio"
                name="shortBio"
                value={profile.shortBio}
                onChange={handleProfileChange}
                placeholder="Write a short intro for your portfolio"
                rows={4}
              />
            </div>
          </article>

          <article className="editor-card" id="projects">
            <div className="card-headline">
              <h2>Projects</h2>
              {githubState === "connected" || githubData ? (
                <div className="github-actions">
                  <button
                    className="text-button"
                    type="button"
                    disabled={githubState === "loading"}
                    onClick={() => setRefreshKey((key) => key + 1)}
                  >
                    {githubState === "loading" ? "Refreshing..." : "Refresh"}
                  </button>
                  {githubState === "connected" ? (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/dashboard" })}
                    >
                      Disconnect
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <p className="github-status" role="status">
              {githubState === "loading" &&
                (githubData
                  ? "Showing saved public repositories while checking GitHub for updates..."
                  : "Loading GitHub repositories...")}
              {githubState === "connected" &&
                `Connected as @${githubUser?.login}. Only public repositories are imported.`}
              {githubState === "disconnected" &&
                "Connect GitHub to import your public repositories."}
              {githubState === "not-configured" &&
                "GitHub OAuth is not configured. Add the credentials from .env.example to .env.local."}
              {githubState === "error" &&
                (githubData
                  ? "Could not refresh GitHub repositories. Showing saved data; try refreshing again."
                  : "Could not load repositories. Try refreshing the list.")}
            </p>

            {githubState === "disconnected" ? (
              <button
                className="button button-primary github-connect-button"
                type="button"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              >
                Connect GitHub
              </button>
            ) : null}

            {githubState === "not-configured" ? (
              <button
                className="button button-primary github-connect-button"
                type="button"
                disabled
              >
                Connect GitHub
              </button>
            ) : null}

            {showRepositoryManager ? (
              <>
                <div className="project-section-heading">
                  <h3>Selected for portfolio</h3>
                  <span>{selectedProjects.length} selected</span>
                </div>

                {selectedProjects.length ? (
                  <div className="selected-project-list">
                    {selectedProjects.map((project, index) => (
                      <article className="selected-project" key={project.id}>
                        <div className="project-row">
                          <div className="project-summary">
                            <strong>{project.name}</strong>
                            <span>
                              {project.language || "Repository"} · ★{" "}
                              {project.stars}
                            </span>
                          </div>
                          <div className="project-order-controls">
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => moveProject(index, -1)}
                              disabled={index === 0}
                              aria-label={`Move ${project.name} up`}
                            >
                              Move up
                            </button>
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => moveProject(index, 1)}
                              disabled={index === selectedProjects.length - 1}
                              aria-label={`Move ${project.name} down`}
                            >
                              Move down
                            </button>
                          </div>
                        </div>
                        <div className="mock-field project-description-field">
                          <label htmlFor={`project-description-${project.id}`}>
                            Portfolio description
                          </label>
                          <textarea
                            id={`project-description-${project.id}`}
                            value={project.portfolioDescription}
                            onChange={(event) =>
                              updateProjectDescription(
                                project.id,
                                event.target.value,
                              )
                            }
                            rows={2}
                            placeholder="Describe what this project does"
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="project-empty-state">
                    Add repositories below to choose what appears in your
                    portfolio.
                  </p>
                )}

                <div className="project-section-heading">
                  <h3>Your repositories</h3>
                  <span>{repositories.length} public</span>
                </div>
                <div className="project-list">
                  {repositories.map((repository) => {
                    const isSelected = selectedProjects.some(
                      (project) => project.id === repository.id,
                    );

                    return (
                      <div className="project-row" key={repository.id}>
                        <div className="project-summary">
                          <strong>{repository.name}</strong>
                          <span>
                            {repository.language || "Repository"} · ★{" "}
                            {repository.stars}
                          </span>
                          {repository.description ? (
                            <span className="repository-description">
                              {repository.description}
                            </span>
                          ) : null}
                        </div>
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => toggleProject(repository)}
                        >
                          {isSelected ? "Remove" : "Add project"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </article>

        </div>
      </section>

      <aside className="preview-panel" id="publish">
        <p className="section-kicker">Live preview</p>
        <h2>How your public portfolio will look</h2>

        <div className="mini-portfolio">
          <p className="mini-eyebrow">{previewName}</p>
          <h3>{previewTitle}</h3>
          <p>{previewBio}</p>
          <button
            type="button"
            className="button button-secondary"
            onClick={handlePreviewPublicUrl}
          >
            Preview public URL
          </button>
        </div>

        <section className="theme-controls" id="theme">
          <h3>Theme controls</h3>
          <div className="theme-swatches">
            {themes.map((theme) => (
              <button
                key={theme.value}
                type="button"
                className={`swatch ${theme.value === selectedTheme ? "active" : ""}`}
                style={{ background: theme.accentGradient }}
                onClick={() => saveTheme(theme.value)}
                aria-label={`Select ${theme.label}`}
              />
            ))}
          </div>
          <p>
            Choose a color theme and see it reflected instantly in the live
            preview.
          </p>
        </section>

        <div className="sync-note">
          <strong>Project settings</strong>
          <p>Selected projects and descriptions are saved in this browser.</p>
        </div>
      </aside>
    </main>
  );
}
