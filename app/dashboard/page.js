"use client";

import Link from "next/link";
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
            <button
              type="button"
              className="button button-primary"
              onClick={editor.publish}
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
