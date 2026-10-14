import { useEffect, useRef, useState } from "react";
import PortfolioDetails from "../../components/portfolio-details";
import ProjectPreview from "../../components/project-preview";
import { getProjectLink } from "../../lib/project-preview";

const safeUrl = (url) => (/^https?:\/\//i.test(url) ? url : undefined);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PreviewPanel({
  profile,
  themes,
  selectedTheme,
  publishedSlug,
  previewSlug,
  selectedProjects,
  onSelectTheme,
}) {
  const previewDialog = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewName = profile.name || "Your Name";
  const previewTitle = profile.role || "Your role will appear here";
  const previewBio =
    profile.shortBio ||
    "Add a short bio in Profile setup to preview your public portfolio.";
  const previewPageName = profile.name || previewSlug || "Your Name";

  useEffect(() => {
    if (previewOpen) previewDialog.current?.showModal();
  }, [previewOpen]);

  return (
    <aside className="preview-panel" id="publish">
      <p className="section-kicker">Live preview</p>
      <h2>How your public portfolio will look</h2>

      <div className="mini-portfolio">
        <p className="mini-eyebrow">{previewName}</p>
        <h3>{previewTitle}</h3>
        <p>{previewBio}</p>
        <div className="mini-portfolio-actions">
          {publishedSlug ? (
            <a
              className="button button-secondary"
              href={`/u/${publishedSlug}`}
              target="_blank"
              rel="noreferrer"
            >
              Open public page
            </a>
          ) : (
            <button type="button" className="button button-secondary" disabled>
              Publish to get your public URL
            </button>
          )}
          <button
            type="button"
            className="button button-primary"
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </button>
        </div>
      </div>

      {previewOpen ? (
        <dialog
          className="portfolio-preview-dialog"
          ref={previewDialog}
          aria-label="Portfolio preview"
          onClose={() => setPreviewOpen(false)}
          onClick={(event) => {
            if (event.target === previewDialog.current) {
              previewDialog.current.close();
            }
          }}
        >
        <div className="preview-page-card preview-dialog-card">
          <div className="preview-page-header">
            <div>
              <p className="preview-page-kicker">Portfolio preview</p>
              <h1>{previewPageName}</h1>
              {profile.role ? <h2>{profile.role}</h2> : null}
            </div>
            <div className="preview-page-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => previewDialog.current?.close()}
              >
                Close preview
              </button>
            </div>
          </div>

          {profile.shortBio ? (
            <section className="preview-page-intro">
              <h3>About</h3>
              <p>{profile.shortBio}</p>
            </section>
          ) : null}

          <PortfolioDetails
            profile={profile}
            githubFallback={
              previewSlug ? `https://github.com/${previewSlug}` : ""
            }
          />

          <section className="preview-page-section">
            <h3>Selected projects</h3>
            <div className="preview-page-projects">
              {selectedProjects.length ? (
                selectedProjects.map((project) => (
                  <article key={project.id}>
                    <a
                      className="project-card-link"
                      href={safeUrl(getProjectLink(project))}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ProjectPreview project={project} />
                      <strong>{project.name}</strong>
                    </a>
                    {project.portfolioDescription ? (
                      <p>{project.portfolioDescription}</p>
                    ) : null}
                    <div className="project-card-meta">
                      {project.language ? <span>{project.language}</span> : null}
                      {safeUrl(project.htmlUrl) ? (
                        <a
                          href={project.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {/github\.com/i.test(project.htmlUrl)
                            ? "GitHub"
                            : "Link"}
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p>No projects yet.</p>
              )}
            </div>
          </section>

          {EMAIL_PATTERN.test(profile.email ?? "") ? (
            <section className="preview-page-section">
              <h3>Contact</h3>
              <p>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </p>
            </section>
          ) : null}
        </div>
        </dialog>
      ) : null}

      <section className="theme-controls" id="theme">
        <h3>Theme controls</h3>
        <div className="theme-swatches">
          {themes.map((theme) => (
            <button
              key={theme.value}
              type="button"
              className={`swatch ${theme.value === selectedTheme ? "active" : ""}`}
              style={{ background: theme.accentGradient }}
              onClick={() => onSelectTheme(theme.value)}
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
        <p>
          Profile, projects and theme are saved to your account when you
          publish.
        </p>
      </div>
    </aside>
  );
}
