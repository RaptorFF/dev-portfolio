import Link from "next/link";
import { notFound } from "next/navigation";
import ApplyTheme from "../../components/apply-theme";
import PortfolioDetails from "../../components/portfolio-details";
import ProjectPreview from "../../components/project-preview";
import { getProjectLink } from "../../lib/project-preview";
import { getSupabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

async function getPortfolio(slug) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("portfolios")
    .select("slug, theme, profile, selected_projects")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Public portfolio load failed:", error);
    return null;
  }

  return data;
}

const safeUrl = (url) => (/^https?:\/\//i.test(url) ? url : undefined);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const portfolio = await getPortfolio(slug);

  return {
    title: portfolio?.profile?.name
      ? `${portfolio.profile.name} - Portfolio`
      : "Portfolio",
  };
}

export default async function PublicPortfolioPage({ params }) {
  const { slug } = await params;
  const portfolio = await getPortfolio(slug);

  if (!portfolio) notFound();

  const { profile, selected_projects: projects } = portfolio;
  const displayName = profile.name || portfolio.slug;
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const hasEmail = EMAIL_PATTERN.test(profile.email ?? "");

  return (
    <main className="public-portfolio">
      <ApplyTheme theme={portfolio.theme} />

      <header className="public-nav">
        <Link className="public-brand" href="/">
          <span aria-hidden="true">P</span>
          <span>Portfolio</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#details">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
        {hasEmail ? (
          <a className="public-nav-contact" href={`mailto:${profile.email}`}>
            Let&apos;s talk <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </header>

      <div className="public-page-content">
        <section className="public-hero" id="about">
          <div className="public-hero-copy">
            <p className="public-eyebrow">
              <span aria-hidden="true" />
              {profile.role || "Personal portfolio"}
            </p>
            <h1>
              Hello, I&apos;m <span>{displayName}</span>
            </h1>
            <p className="public-hero-description">
              {profile.shortBio ||
                "Welcome to my portfolio. Explore my selected work and learn more about my experience."}
            </p>
            <div className="public-hero-actions">
              <a className="public-button public-button-primary" href="#work">
                Explore my work <span aria-hidden="true">↓</span>
              </a>
              {hasEmail ? (
                <a className="public-button public-button-secondary" href={`mailto:${profile.email}`}>
                  Get in touch
                </a>
              ) : null}
            </div>
            <p className="public-hero-caption">
              Explore selected work <span aria-hidden="true">·</span>{" "}
              Learn about my experience
            </p>
          </div>

          <div className="public-hero-art" aria-hidden="true">
            <div className="public-orbit public-orbit-one" />
            <div className="public-orbit public-orbit-two" />
            <div className="public-monogram">{initials}</div>
            <div className="public-art-label">
              <span>{displayName}</span>
              <span>{profile.role || "Portfolio"}</span>
            </div>
          </div>
        </section>

        <section className="public-work-section" id="work">
          <div className="public-section-heading">
            <div>
              <p className="public-section-kicker">A few things I&apos;ve made</p>
              <h2>Selected work<span>.</span></h2>
            </div>
            <p>
              A selection of projects that show what I enjoy building and the
              problems I like to solve.
            </p>
          </div>

          <div className="public-project-grid">
            {projects.length ? (
              projects.map((project, index) => (
                <article className="public-project-card" key={project.id}>
                  <a
                    className="public-project-link"
                    href={safeUrl(getProjectLink(project))}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${project.name}`}
                  >
                    <ProjectPreview project={project} />
                    <span className="public-project-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="public-project-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                  <div className="public-project-info">
                    <div>
                      <h3>{project.name}</h3>
                      {project.portfolioDescription ? (
                        <p>{project.portfolioDescription}</p>
                      ) : null}
                    </div>
                    <div className="public-project-meta">
                      {project.language ? <span>{project.language}</span> : null}
                      {safeUrl(project.htmlUrl) ? (
                        <a href={project.htmlUrl} target="_blank" rel="noreferrer">
                          {/github\.com/i.test(project.htmlUrl)
                            ? "GitHub"
                            : "Visit project"}
                          <span aria-hidden="true"> ↗</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="public-empty-state">No projects have been selected yet.</p>
            )}
          </div>
        </section>

        <section className="public-details-section" id="details">
          <div className="public-section-heading">
            <div>
              <p className="public-section-kicker">The person behind the work</p>
              <h2>A little more about me<span>.</span></h2>
            </div>
          </div>
          <PortfolioDetails
            profile={profile}
            githubFallback={`https://github.com/${portfolio.slug}`}
          />
        </section>

        <section className="public-contact-section" id="contact">
          <div>
            <p className="public-section-kicker">Have a project in mind?</p>
            <h2>Let&apos;s make something great<span>.</span></h2>
            <p>
              Interested in working together or just want to say hello? I&apos;d
              love to hear from you.
            </p>
          </div>
          {hasEmail ? (
            <a
              className="public-button public-button-primary"
              href={`mailto:${profile.email}`}
            >
              Say hello <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <a className="public-button public-button-secondary" href="#details">
              Find me online
            </a>
          )}
        </section>
      </div>

      <footer className="public-footer">
        <Link className="public-brand" href="/">
          <span aria-hidden="true">P</span>
          <span>Portfolio</span>
        </Link>
        <p>© {new Date().getFullYear()} {displayName}. All rights reserved.</p>
        <a href="#about">Back to top ↑</a>
      </footer>
    </main>
  );
}
