import Link from "next/link";

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
            <button type="button" className="button button-secondary">
              Save draft
            </button>
            <button type="button" className="button button-primary">
              Publish
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          <article className="editor-card" id="profile">
            <h2>Profile setup</h2>
            <div className="mock-field">
              <label>Name</label>
              <div>Filip Frontend</div>
            </div>
            <div className="mock-field">
              <label>Role</label>
              <div>Frontend Developer and Product Designer</div>
            </div>
            <div className="mock-field">
              <label>Short bio</label>
              <div>
                Building polished interfaces and launching portfolio-ready web
                products.
              </div>
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
          <p className="mini-eyebrow">Filip Frontend</p>
          <h3>Frontend Developer crafting bold web experiences</h3>
          <p>
            This panel previews the chosen layout, project cards, and profile
            details before publishing.
          </p>
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
