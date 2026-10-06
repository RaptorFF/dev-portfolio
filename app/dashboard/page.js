"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  getThemeOptions,
  THEME_STORAGE_KEY as THEME_STORAGE,
} from "../lib/themes";

const PROFILE_STORAGE_KEY = "portfolio-forge-profile-draft";
const PROJECTS_STORAGE_KEY = "portfolio-forge-github-projects";

const defaultProfile = {
  name: "",
  role: "",
  shortBio: "",
};

function getInitialTheme() {
  if (typeof window === "undefined") return "purple";

  return window.localStorage.getItem(THEME_STORAGE) || "purple";
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(defaultProfile);
  const [saveStatus, setSaveStatus] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(getInitialTheme);
  const [githubState, setGithubState] = useState("loading");
  const [githubUser, setGithubUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
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
          setGithubState("disconnected");
          return;
        }

        if (response.status === 503) {
          setGithubState("not-configured");
          return;
        }

        if (!response.ok) throw new Error(data.error);

        setGithubUser(data.user);
        setRepositories(data.repositories);
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

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setSaveStatus("");
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(THEME_STORAGE, selectedTheme);
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  function handleSaveDraft() {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setSaveStatus("Draft profile je sačuvan.");
  }

  function handlePreviewPublicUrl() {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
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
              {githubState === "connected" ? (
                <div className="github-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setRefreshKey((key) => key + 1)}
                  >
                    Refresh
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/dashboard" })}
                  >
                    Disconnect
                  </button>
                </div>
              ) : null}
            </div>

            <p className="github-status" role="status">
              {githubState === "loading" && "Loading GitHub repositories..."}
              {githubState === "connected" &&
                `Connected as @${githubUser?.login}. Only public repositories are imported.`}
              {githubState === "disconnected" &&
                "Connect GitHub to import your public repositories."}
              {githubState === "not-configured" &&
                "GitHub OAuth is not configured. Add the credentials from .env.example to .env.local."}
              {githubState === "error" &&
                "Could not load repositories. Try refreshing the list."}
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

            {githubState === "connected" ? (
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

          <article className="editor-card" id="theme">
            <h2>Theme controls</h2>
            <div className="theme-swatches">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  className={`swatch ${theme.value === selectedTheme ? "active" : ""}`}
                  style={{ background: theme.accentGradient }}
                  onClick={() => setSelectedTheme(theme.value)}
                  aria-label={`Select ${theme.label}`}
                />
              ))}
            </div>
            <p>
              Choose a color theme and see it reflected instantly in the live
              preview.
            </p>
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

        <div className="sync-note">
          <strong>Project settings</strong>
          <p>Selected projects and descriptions are saved in this browser.</p>
        </div>
      </aside>
    </main>
  );
}
