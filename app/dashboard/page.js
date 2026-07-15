"use client";

import Link from "next/link";
import { useState } from "react";

const PROFILE_STORAGE_KEY = "portfolio-forge-profile-draft";

const defaultProfile = {
  name: "",
  role: "",
  shortBio: "",
};

const draftProjects = [
  {
    name: "Realtime Habit Tracker",
    status: "Ready to publish",
    source: "Manual",
  },
  {
    name: "SaaS Billing Dashboard",
    status: "Needs summary",
    source: "GitHub (soon)",
  },
  {
    name: "AI Landing Page",
    status: "Draft",
    source: "Manual",
  },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") return defaultProfile;

    const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!savedProfile) return defaultProfile;

    try {
      const parsedProfile = JSON.parse(savedProfile);
      return { ...defaultProfile, ...parsedProfile };
    } catch {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      return defaultProfile;
    }
  });
  const [saveStatus, setSaveStatus] = useState("");

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setSaveStatus("");
  }

  function handleSaveDraft() {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setSaveStatus("Draft profile je sačuvan.");
  }

  const previewName = profile.name || "Your Name";
  const previewTitle = profile.role
    ? `${profile.role} crafting bold web experiences`
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
              <input
                id="profile-role"
                name="role"
                value={profile.role}
                onChange={handleProfileChange}
                placeholder="e.g. Frontend Developer and Product Designer"
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
              <span className="chip">GitHub import in next phase</span>
            </div>

            <div className="project-list">
              {draftProjects.map((project) => (
                <div className="project-row" key={project.name}>
                  <div>
                    <strong>{project.name}</strong>
                    <span>{project.source}</span>
                  </div>
                  <span className="chip subtle">{project.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="editor-card" id="theme">
            <h2>Theme controls</h2>
            <div className="theme-swatches">
              <button type="button" className="swatch swatch-purple" />
              <button type="button" className="swatch swatch-indigo" />
              <button type="button" className="swatch swatch-slate" />
            </div>
            <p>
              Let users choose typography style, spacing density, and accent
              color without touching code.
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
          <button type="button" className="button button-secondary">
            Preview public URL
          </button>
        </div>

        <div className="sync-note">
          <strong>Next milestone</strong>
          <p>
            Connect GitHub and map repositories into this preview automatically.
          </p>
        </div>
      </aside>
    </main>
  );
}
