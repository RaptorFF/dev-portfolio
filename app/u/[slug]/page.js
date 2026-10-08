import Link from "next/link";
import { notFound } from "next/navigation";
import ApplyTheme from "../../components/apply-theme";
import { getSupabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

// Fetch the portfolio data from Supabase based on the slug. Returns null if not found or on error.
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

  return (
    <main className="preview-page-shell">
      <ApplyTheme theme={portfolio.theme} />
      <section className="preview-page-card">
        <div className="preview-page-header">
          <div>
            <h1>{profile.name || portfolio.slug}</h1>
            {profile.role ? <h2>{profile.role}</h2> : null}
          </div>
          <div className="preview-page-actions">
            <a
              className="button button-secondary"
              href={`https://github.com/${portfolio.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <Link className="button button-primary" href="/">
              Portfolio Forge
            </Link>
          </div>
        </div>

        {profile.shortBio ? (
          <div className="preview-page-intro">
            <h3>About</h3>
            <p>{profile.shortBio}</p>
          </div>
        ) : null}

        <section className="preview-page-section">
          <h3>Selected projects</h3>
          <div className="preview-page-projects">
            {projects.length ? (
              projects.map((project) => (
                <article key={project.id}>
                  <a
                    href={safeUrl(project.htmlUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <strong>{project.name}</strong>
                  </a>
                  {project.portfolioDescription ? (
                    <p>{project.portfolioDescription}</p>
                  ) : null}
                  {project.language ? <span>{project.language}</span> : null}
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
      </section>
    </main>
  );
}
