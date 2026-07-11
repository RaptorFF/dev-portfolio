"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const features = [
    {
      title: "Portfolio builder",
      description:
        "Users can pick a layout, customize sections, and publish a personal portfolio without touching code.",
    },
    {
      title: "GitHub project import",
      description:
        "Connect a GitHub account and automatically pull repositories, readme content, stars, and metadata.",
    },
    {
      title: "Freemium tiers",
      description:
        "Give everyone a polished free plan, then unlock custom domains, analytics, and extra templates in Pro.",
    },
  ];

  const workflow = [
    {
      title: "1. Create your profile",
      category: "Start free",
      description:
        "Choose a theme, add your bio, and generate a clean portfolio in minutes.",
    },
    {
      title: "2. Sync GitHub",
      category: "Connect repositories",
      description:
        "Import public repositories and turn your GitHub activity into ready-made portfolio projects.",
    },
    {
      title: "3. Publish and share",
      category: "Go live",
      description:
        "Publish your site and upgrade when you need pro templates, custom branding, or domain support.",
    },
  ];

  const pricing = [
    {
      name: "Free",
      price: "$0",
      note: "For personal portfolios and quick launches",
      items: ["1 portfolio", "GitHub import", "Basic templates"],
    },
    {
      name: "Pro",
      price: "$12/mo",
      note: "For creators who want more control and branding",
      items: ["Custom domain", "Advanced analytics", "Extra sections"],
    },
  ];

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="portfolio-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-mark">D</span>
          <span>Portfolio Forge</span>
        </a>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav
          className={`nav-links ${menuOpen ? "active" : ""}`}
          aria-label="Primary"
        >
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>
            Pricing
          </a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>
            Contact
          </a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">
            Freemium portfolio builder with GitHub import
          </p>
          <h1>
            Let creators build a premium portfolio and sync projects from
            GitHub.
          </h1>
          <p className="hero-text">
            Portfolio Forge is a freemium web app where users can create a
            polished portfolio, import their GitHub projects automatically, and
            upgrade for more control when they need it.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#workflow">
              See the flow
            </a>
            <Link className="button button-secondary" href="/dashboard">
              Open dashboard preview
            </Link>
          </div>

          <div className="hero-metrics" aria-label="Profile highlights">
            <div>
              <strong>Free to start</strong>
              <span>Users can launch without payment</span>
            </div>
            <div>
              <strong>GitHub sync</strong>
              <span>Repos become portfolio projects</span>
            </div>
            <div>
              <strong>Upgrade path</strong>
              <span>Pro unlocks branding and analytics</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="portrait-card">
            <div className="portrait-badge">GitHub import preview</div>
            <div className="portrait-screen">
              <div className="screen-lines" />
              <div className="screen-orbit" />
            </div>
            <div className="portrait-footer">
              <span>Repositories</span>
              <span>Templates</span>
              <span>Publishing</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section intro" id="features">
        <p className="section-kicker">About</p>
        <h2>
          A product that turns GitHub activity into a portfolio that feels
          custom-made, not generic.
        </h2>
        <p>
          The app combines a clean editor, one-click GitHub import, and a
          freemium model so users can start free and upgrade only when the extra
          value matters.
        </p>
      </section>

      <section className="section" id="workflow">
        <div className="section-header">
          <p className="section-kicker">How it works</p>
          <h2>The simplest path from GitHub repo to live portfolio</h2>
        </div>

        <div className="experience-list">
          {workflow.map((item) => (
            <article className="experience-card" key={item.title}>
              <div className="experience-meta">
                <span>{item.category}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="section-header">
          <p className="section-kicker">Pricing</p>
          <h2>Start free, then upgrade for the features that matter</h2>
        </div>

        <div className="projects-grid">
          {pricing.map((plan) => (
            <article className="project-card" key={plan.name}>
              <div className="project-number">{plan.price}</div>
              <p className="project-category">{plan.name}</p>
              <h3>{plan.note}</h3>
              <p>{plan.items.join(" • ")}</p>
              <a href="#contact">Get early access</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section contact-section" id="contact">
        <div>
          <p className="section-kicker">Contact</p>
          <h2>Want to build this as a real product with GitHub sync?</h2>
        </div>

        <div className="contact-card">
          <p>
            Next step can be turning this into a working MVP with auth, GitHub
            OAuth, portfolio templates, and a free/pro subscription flow.
          </p>
          <a className="button button-primary" href="mailto:hello@example.com">
            Talk about the MVP
          </a>
        </div>
      </section>
    </main>
  );
}
