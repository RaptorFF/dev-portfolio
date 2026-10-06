"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { applyTheme, THEME_STORAGE_KEY as THEME_STORAGE } from "../lib/themes";

const PROFILE_STORAGE_KEY = "portfolio-forge-profile-draft";
const PROJECTS_STORAGE_KEY = "portfolio-forge-github-projects";

const defaultProfile = {
  name: "Your Name",
  role: "Your role will appear here",
  shortBio:
    "Add a short bio in Profile setup to preview your public portfolio.",
};

function getInitialProfile() {
  if (typeof window === "undefined") return defaultProfile;

  const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!savedProfile) return defaultProfile;

  try {
    return { ...defaultProfile, ...JSON.parse(savedProfile) };
  } catch {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    return defaultProfile;
  }
}

function getInitialProjects() {
  if (typeof window === "undefined") return [];

  try {
    const savedProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];
    return Array.isArray(parsedProjects) ? parsedProjects : [];
  } catch {
    return [];
  }
}

export default function PreviewPage() {
  const [profile] = useState(getInitialProfile);
  const [projects] = useState(getInitialProjects);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = window.localStorage.getItem(THEME_STORAGE);
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      applyTheme("purple");
    }
  }, []);

  return (
    <main className="preview-page-shell">
      <section className="preview-page-card">
        <div className="preview-page-header">
          <div>
            <p className="preview-page-kicker">Public portfolio preview</p>
            <h1>{profile.name || "Your Name"}</h1>
            <h2>{profile.role || "Your role will appear here"}</h2>
          </div>
          <div className="preview-page-actions">
            <Link className="button button-primary" href="/dashboard">
              Back to dashboard
            </Link>
            <Link className="button button-secondary" href="/">
              Go home
            </Link>
          </div>
        </div>

        <div className="preview-page-intro">
          <p>
            {profile.shortBio ||
              "Add a short bio in Profile setup to preview your public portfolio."}
          </p>
        </div>

        <section className="preview-page-section">
          <h3>About</h3>
          <p>
            I build polished digital experiences with a focus on clarity,
            motion, and thoughtful product design.
          </p>
        </section>

        <section className="preview-page-section">
          <h3>Selected projects</h3>
          <div className="preview-page-projects">
            {projects.length ? (
              projects.map((project) => (
                <article key={project.id}>
                  <a href={project.htmlUrl} target="_blank" rel="noreferrer">
                    <strong>{project.name}</strong>
                  </a>
                  <p>
                    {project.portfolioDescription ||
                      "Project description coming soon."}
                  </p>
                  {project.language ? <span>{project.language}</span> : null}
                </article>
              ))
            ) : (
              <p>No projects selected yet.</p>
            )}
          </div>
        </section>

        <section className="preview-page-section">
          <h3>Contact</h3>
          <p>hello@portfolioforge.dev</p>
        </section>
      </section>
    </main>
  );
}
