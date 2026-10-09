"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import PreviewPanel from "./_components/preview-panel";
import ProfileEditor from "./_components/profile-editor";
import ProjectsManager from "./_components/projects-manager";
import { usePortfolioEditor } from "../lib/use-portfolio-editor";
import { useTheme } from "../lib/use-theme";

export default function DashboardPage() {
  const { themes, selectedTheme, saveTheme } = useTheme();
  const editor = usePortfolioEditor({ themes, selectedTheme, saveTheme });

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
            {editor.authState === "anonymous" ? (
              <Link className="button button-secondary" href="/login">
                Sign in
              </Link>
            ) : null}
            {editor.authState === "authenticated" ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </button>
            ) : null}
            <button
              type="button"
              className="button button-primary"
              onClick={editor.publish}
              disabled={!editor.canPublish}
              title={
                editor.canPublish
                  ? undefined
                  : "Fix your portfolio link before publishing"
              }
            >
              Publish
            </button>
          </div>
        </header>

        {editor.saveStatus ? (
          <p className="save-status">
            {editor.saveStatus}{" "}
            {editor.saveStatus === "Portfolio je objavljen:" &&
            editor.publishedSlug ? (
              <a
                href={`/u/${editor.publishedSlug}`}
                target="_blank"
                rel="noreferrer"
              >
                /u/{editor.publishedSlug}
              </a>
            ) : null}
          </p>
        ) : null}

        {editor.canEditSlug ? (
          <div className="mock-field" id="publish">
            <label htmlFor="portfolio-slug">Your portfolio link</label>
            <input
              id="portfolio-slug"
              value={editor.slug}
              onChange={(event) => editor.updateSlug(event.target.value)}
              placeholder={editor.suggestedSlug || "e.g. filip-frontend"}
              maxLength={30}
            />
            <span className="repository-description">
              This is the web address you share with others. Pick a short name
              (3-30 letters, numbers or dashes). If you leave it empty, we use{" "}
              {editor.suggestedSlug ? (
                <strong>{editor.suggestedSlug}</strong>
              ) : (
                "a name based on your profile"
              )}
              .
            </span>
            <span className="repository-description" role="status">
              {
                {
                  checking: "Checking availability...",
                  available: "✓ This link is available.",
                  taken: "✗ This link is already taken. Try another one.",
                  invalid:
                    "Use 3-30 letters, numbers or dashes (not at the start or end).",
                  error: "Could not check availability right now.",
                }[editor.slugStatus]
              }
            </span>
            <span className="repository-description">
              Your portfolio will be at:{" "}
              <strong>
                /u/{editor.slug || editor.suggestedSlug || "your-name"}
              </strong>
            </span>
          </div>
        ) : null}

        <div className="dashboard-grid">
          <ProfileEditor
            profile={editor.profile}
            onChange={editor.updateProfileField}
          />
          <ProjectsManager
            githubState={editor.githubState}
            githubData={editor.githubData}
            githubUser={editor.githubUser}
            repositories={editor.repositories}
            showRepositoryManager={editor.showRepositoryManager}
            selectedProjects={editor.selectedProjects}
            onRefresh={editor.refresh}
            onToggleProject={editor.toggleProject}
            onMoveProject={editor.moveProject}
            onUpdateDescription={editor.updateProjectDescription}
            onAddCustomProject={editor.addCustomProject}
            onRemoveProject={editor.removeProject}
          />
        </div>
      </section>

      <PreviewPanel
        profile={editor.profile}
        themes={themes}
        selectedTheme={selectedTheme}
        publishedSlug={editor.publishedSlug}
        onSelectTheme={saveTheme}
      />
    </main>
  );
}
