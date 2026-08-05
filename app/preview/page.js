"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PROFILE_STORAGE_KEY = "portfolio-forge-profile-draft";

export default function PreviewPage() {
  const [profile, setProfile] = useState({
    name: "Your Name",
    role: "Your role will appear here",
    shortBio:
      "Add a short bio in Profile setup to preview your public portfolio.",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!savedProfile) return;

    try {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile((prev) => ({ ...prev, ...parsedProfile }));
    } catch {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
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
            <article>
              <strong>Portfolio Forge</strong>
              <p>Design-led portfolio builder for modern creators.</p>
            </article>
            <article>
              <strong>Realtime dashboard</strong>
              <p>Clean analytics experience built with product thinking.</p>
            </article>
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
