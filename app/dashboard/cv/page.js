"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const emptyProfile = { name: "", role: "", email: "", shortBio: "" };
const emptyCv = {
  template: "modern",
  experience: [],
  education: [],
  skills: [],
};
const CV_DRAFT_KEY = "portfolio-forge-cv-draft-v1";

const templates = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
];

function CvEntryFields({ entry, fields, onChange, onRemove }) {
  return (
    <article className="cv-entry-form">
      <div className="cv-entry-header">
        <strong>{entry.title || entry.qualification || "New entry"}</strong>
        <button className="text-button" type="button" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="cv-entry-grid">
        {fields.map((field) => (
          <label className="mock-field" key={field.name}>
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea
                value={entry[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
                rows={3}
                maxLength={field.maxLength}
              />
            ) : (
              <input
                value={entry[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
                maxLength={field.maxLength}
              />
            )}
          </label>
        ))}
      </div>
    </article>
  );
}

export default function CvBuilderPage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [cv, setCv] = useState(emptyCv);
  const [skillsText, setSkillsText] = useState("");
  const [status, setStatus] = useState(
    "Your draft is saved automatically in this browser.",
  );
  const [loaded, setLoaded] = useState(false);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedDraft = window.localStorage.getItem(CV_DRAFT_KEY);
        if (savedDraft) {
          const data = JSON.parse(savedDraft);
          const savedProfile =
            data.profile && typeof data.profile === "object"
              ? data.profile
              : {};
          const savedCv = data.cv && typeof data.cv === "object" ? data.cv : {};
          const skills = Array.isArray(savedCv.skills) ? savedCv.skills : [];

          setProfile({ ...emptyProfile, ...savedProfile });
          setCv({
            ...emptyCv,
            ...savedCv,
            experience: Array.isArray(savedCv.experience)
              ? savedCv.experience
              : [],
            education: Array.isArray(savedCv.education)
              ? savedCv.education
              : [],
            skills,
          });
          setSkillsText(skills.join(", "));
        }
        setStatus("Your draft is saved automatically in this browser.");
      } catch (error) {
        console.error("Could not load saved CV draft:", error);
        setStatus(
          "Could not read the saved draft. You can continue editing and download a PDF.",
        );
      }

      setLoaded(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!loaded || !edited) return;

    const frame = window.requestAnimationFrame(() => {
      try {
        window.localStorage.setItem(
          CV_DRAFT_KEY,
          JSON.stringify({
            profile,
            cv: {
              ...cv,
              skills: skillsText
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
            },
          }),
        );
        setStatus("Draft saved automatically in this browser.");
      } catch (error) {
        console.error("Could not save CV draft:", error);
        setStatus("Could not save the draft in this browser.");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [cv, edited, loaded, profile, skillsText]);

  function updateProfile(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setEdited(true);
  }

  function addEntry(section, entry) {
    setCv((current) => ({
      ...current,
      [section]: [...current[section], entry],
    }));
    setEdited(true);
  }

  function updateEntry(section, index, field, value) {
    setCv((current) => ({
      ...current,
      [section]: current[section].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
    setEdited(true);
  }

  function removeEntry(section, index) {
    setCv((current) => ({
      ...current,
      [section]: current[section].filter((_, entryIndex) => entryIndex !== index),
    }));
    setEdited(true);
  }

  function updateSkills(value) {
    setSkillsText(value);
    setEdited(true);
  }

  return (
    <main className="dashboard-shell cv-dashboard-shell">
      <aside className="dashboard-sidebar cv-sidebar">
        <Link className="dashboard-brand" href="/dashboard">
          <span className="brand-mark">P</span>
          <div>
            <strong>Portfolio Forge</strong>
            <span>Creator Dashboard</span>
          </div>
        </Link>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link href="/dashboard">Portfolio</Link>
          <Link className="active" href="/dashboard/cv">
            CV Builder
          </Link>
        </nav>
        <div className="sync-note">
          <strong>Private draft</strong>
          <p>
            Your CV draft is saved in this browser. Download it as a PDF to
            keep a copy on your device.
          </p>
        </div>
      </aside>

      <section className="dashboard-main cv-builder-main">
        <header className="dashboard-header">
          <div>
            <p className="section-kicker">CV Builder</p>
            <h1>Create a professional CV</h1>
          </div>
          <div className="header-actions cv-actions">
            <Link className="button button-secondary" href="/dashboard">
              Back to portfolio
            </Link>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => window.print()}
            >
              Download PDF
            </button>
          </div>
        </header>

        {status ? (
          <p className="save-status cv-status" role="status">
            {status}
          </p>
        ) : null}

        <div className="cv-template-picker" aria-label="CV template">
          <strong>Template</strong>
          {templates.map((template) => (
            <button
              className={`cv-template-option ${cv.template === template.id ? "active" : ""}`}
              type="button"
              key={template.id}
              onClick={() => {
                setCv((current) => ({ ...current, template: template.id }));
                setEdited(true);
              }}
            >
              {template.label}
            </button>
          ))}
        </div>

        <div className={`cv-layout cv-template-${cv.template}`}>
          <article className="editor-card cv-editor-card">
            <h2>Profile details</h2>
            <div className="cv-profile-grid">
              <label className="mock-field">
                <span>Full name</span>
                <input
                  name="name"
                  value={profile.name}
                  onChange={updateProfile}
                  maxLength={100}
                  placeholder="Your name"
                />
              </label>
              <label className="mock-field">
                <span>Professional title</span>
                <input
                  name="role"
                  value={profile.role}
                  onChange={updateProfile}
                  maxLength={200}
                  placeholder="e.g. Frontend Developer"
                />
              </label>
              <label className="mock-field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={updateProfile}
                  maxLength={200}
                  placeholder="you@example.com"
                />
              </label>
              <label className="mock-field cv-summary-field">
                <span>Professional summary</span>
                <textarea
                  name="shortBio"
                  value={profile.shortBio}
                  onChange={updateProfile}
                  maxLength={1000}
                  rows={4}
                  placeholder="A concise summary of your experience and strengths"
                />
              </label>
            </div>
          </article>

          <article className="editor-card cv-editor-card">
            <div className="cv-section-heading">
              <div>
                <h2>Experience</h2>
                <p>Add your recent and relevant roles.</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() =>
                  addEntry("experience", {
                    title: "",
                    organization: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  })
                }
              >
                Add experience
              </button>
            </div>
            {cv.experience.map((entry, index) => (
              <CvEntryFields
                key={`experience-${index}`}
                entry={entry}
                onChange={(field, value) =>
                  updateEntry("experience", index, field, value)
                }
                onRemove={() => removeEntry("experience", index)}
                fields={[
                  { name: "title", label: "Job title", maxLength: 100 },
                  {
                    name: "organization",
                    label: "Company",
                    maxLength: 100,
                  },
                  { name: "startDate", label: "From", maxLength: 40 },
                  { name: "endDate", label: "To", maxLength: 40 },
                  {
                    name: "description",
                    label: "Responsibilities and achievements",
                    multiline: true,
                    maxLength: 1500,
                  },
                ]}
              />
            ))}
          </article>

          <article className="editor-card cv-editor-card">
            <div className="cv-section-heading">
              <div>
                <h2>Education</h2>
                <p>Add degrees, courses or other relevant education.</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() =>
                  addEntry("education", {
                    qualification: "",
                    institution: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  })
                }
              >
                Add education
              </button>
            </div>
            {cv.education.map((entry, index) => (
              <CvEntryFields
                key={`education-${index}`}
                entry={entry}
                onChange={(field, value) =>
                  updateEntry("education", index, field, value)
                }
                onRemove={() => removeEntry("education", index)}
                fields={[
                  {
                    name: "qualification",
                    label: "Qualification",
                    maxLength: 120,
                  },
                  {
                    name: "institution",
                    label: "Institution",
                    maxLength: 120,
                  },
                  { name: "startDate", label: "From", maxLength: 40 },
                  { name: "endDate", label: "To", maxLength: 40 },
                  {
                    name: "description",
                    label: "Details (optional)",
                    multiline: true,
                    maxLength: 1000,
                  },
                ]}
              />
            ))}
          </article>

          <article className="editor-card cv-editor-card">
            <h2>Skills</h2>
            <label className="mock-field">
              <span>Separate skills with commas</span>
              <textarea
                value={skillsText}
                onChange={(event) => updateSkills(event.target.value)}
                rows={3}
                placeholder="React, JavaScript, Accessibility"
              />
            </label>
          </article>

          <article className="cv-document">
            <header className="cv-document-header">
              <h2>{profile.name || "Your Name"}</h2>
              {profile.role ? <h3>{profile.role}</h3> : null}
              {profile.email ? <p>{profile.email}</p> : null}
            </header>
            {profile.shortBio ? (
              <section>
                <h3>Profile</h3>
                <p>{profile.shortBio}</p>
              </section>
            ) : null}
            {cv.experience.length ? (
              <section>
                <h3>Experience</h3>
                {cv.experience.map((entry, index) => (
                  <div className="cv-document-entry" key={`cv-exp-${index}`}>
                    <div>
                      <strong>{entry.title || "Job title"}</strong>
                      <span>{entry.organization}</span>
                    </div>
                    <span>
                      {[entry.startDate, entry.endDate].filter(Boolean).join(" – ")}
                    </span>
                    {entry.description ? <p>{entry.description}</p> : null}
                  </div>
                ))}
              </section>
            ) : null}
            {cv.education.length ? (
              <section>
                <h3>Education</h3>
                {cv.education.map((entry, index) => (
                  <div className="cv-document-entry" key={`cv-edu-${index}`}>
                    <div>
                      <strong>{entry.qualification || "Qualification"}</strong>
                      <span>{entry.institution}</span>
                    </div>
                    <span>
                      {[entry.startDate, entry.endDate].filter(Boolean).join(" – ")}
                    </span>
                    {entry.description ? <p>{entry.description}</p> : null}
                  </div>
                ))}
              </section>
            ) : null}
            {cv.skills.length ? (
              <section>
                <h3>Skills</h3>
                <p>{cv.skills.join(" · ")}</p>
              </section>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}
