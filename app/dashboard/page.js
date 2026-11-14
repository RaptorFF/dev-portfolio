"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import PreviewPanel from "./_components/preview-panel";
import ProfileEditor from "./_components/profile-editor";
import ProjectsManager from "./_components/projects-manager";
import { usePortfolioEditor } from "../lib/use-portfolio-editor";
import { useTheme } from "../lib/use-theme";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showFloatingPublish, setShowFloatingPublish] = useState(false);
  const [floatingPublishPosition, setFloatingPublishPosition] = useState(null);
  const publishButtonRef = useRef(null);
  const previewPanelRef = useRef(null);
  const { themes, selectedTheme, saveTheme } = useTheme();
  const editor = usePortfolioEditor({ themes, selectedTheme, saveTheme });
  const portfolioPublished =
    editor.saveStatus === "Portfolio je objavljen:" && Boolean(editor.publishedSlug);
  const githubAuthorizationExpired = editor.saveStatus.startsWith(
    "GitHub autorizacija je istekla",
  );

  // Update active section based on URL hash
  useEffect(() => {
    const updateActiveSection = () => {
      const section = window.location.hash.slice(1) || "overview";
      if (["overview", "profile", "projects"].includes(section)) {
        setActiveSection(section);
      }
    };

    updateActiveSection();
    window.addEventListener("hashchange", updateActiveSection);
    return () => window.removeEventListener("hashchange", updateActiveSection);
  }, []);

  useEffect(() => {
    const publishButton = publishButtonRef.current;
    if (!publishButton) return;

    const updateFloatingPublishVisibility = () => {
      setShowFloatingPublish(
        publishButton.getBoundingClientRect().bottom <= 0,
      );
    };

    updateFloatingPublishVisibility();
    window.addEventListener("scroll", updateFloatingPublishVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateFloatingPublishVisibility);
    return () => {
      window.removeEventListener("scroll", updateFloatingPublishVisibility);
      window.removeEventListener("resize", updateFloatingPublishVisibility);
    };
  }, []);

  useEffect(() => {
    if (!showFloatingPublish) return;

    const previewPanel = previewPanelRef.current;
    if (!previewPanel) return;

    const updateFloatingPublishPosition = () => {
      if (window.matchMedia("(max-width: 960px)").matches) {
        setFloatingPublishPosition({
          left: "auto",
          right: "calc(20px + env(safe-area-inset-right, 0px))",
        });
        return;
      }

      setFloatingPublishPosition({
        left: `${previewPanel.getBoundingClientRect().left}px`,
        right: "auto",
      });
    };

    updateFloatingPublishPosition();
    window.addEventListener("resize", updateFloatingPublishPosition);
    return () =>
      window.removeEventListener("resize", updateFloatingPublishPosition);
  }, [showFloatingPublish]);

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/">
          <span className="brand-mark">P</span>
          <div>
            <strong>Portfolio Forge</strong>
            <span>Creator Dashboard</span>
          </div>
        </Link>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link
            className={activeSection === "overview" ? "active" : ""}
            href="#overview"
            onClick={() => setActiveSection("overview")}
          >
            Overview
          </Link>
          <Link
            className={activeSection === "profile" ? "active" : ""}
            href="#profile"
            onClick={() => setActiveSection("profile")}
          >
            Profile
          </Link>
          <Link
            className={activeSection === "projects" ? "active" : ""}
            href="#projects"
            onClick={() => setActiveSection("projects")}
          >
            Projects
          </Link>
          <Link href="/dashboard/cv">CV Builder</Link>
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
              ref={publishButtonRef}
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
            {portfolioPublished ? (
              <a
                href={`/u/${editor.publishedSlug}`}
                target="_blank"
                rel="noreferrer"
              >
                /u/{editor.publishedSlug}
              </a>
            ) : null}
            {githubAuthorizationExpired ? (
              <button
                type="button"
                className="button button-primary"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              >
                Reconnect GitHub
              </button>
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
              placeholder={editor.suggestedSlug || "e.g. your-name-portfolio"}
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
            githubFallback={
              editor.githubUser?.login
                ? `https://github.com/${editor.githubUser.login}`
                : ""
            }
            skillsText={editor.skillsText}
            onChange={editor.updateProfileField}
            onAvatarChange={editor.updateAvatar}
            onRemoveAvatar={editor.removeAvatar}
            onSkillsChange={editor.updateSkills}
            onSocialLinkChange={editor.updateSocialLink}
            onEntryChange={editor.updateProfileEntry}
            onAddEntry={editor.addProfileEntry}
            onRemoveEntry={editor.removeProfileEntry}
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
            onUpdatePreviewImage={editor.updateProjectPreviewImage}
            onRefreshPreview={editor.requestPreviewRefresh}
            onAddCustomProject={editor.addCustomProject}
            onRemoveProject={editor.removeProject}
          />
        </div>
        {showFloatingPublish && floatingPublishPosition ? (
          <div
            className={`floating-publish${portfolioPublished ? " floating-publish-published" : ""}`}
            style={floatingPublishPosition}
          >
            {githubAuthorizationExpired ? (
              <div className="floating-publish-notice" role="alert">
                <span>{editor.saveStatus}</span>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() =>
                    signIn("github", { callbackUrl: "/dashboard" })
                  }
                >
                  Reconnect GitHub
                </button>
              </div>
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
            {portfolioPublished ? (
              <p className="floating-publish-success" role="status">
                {editor.saveStatus}{" "}
                <a
                  href={`/u/${editor.publishedSlug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  /u/{editor.publishedSlug}
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <PreviewPanel
        previewPanelRef={previewPanelRef}
        profile={editor.profile}
        themes={themes}
        selectedTheme={selectedTheme}
        publishedSlug={editor.publishedSlug}
        previewSlug={editor.slug || editor.suggestedSlug}
        selectedProjects={editor.selectedProjects}
        onSelectTheme={saveTheme}
      />
    </main>
  );
}
