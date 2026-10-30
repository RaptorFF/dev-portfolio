"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CvDocument from "./CvDocument";
import {
  CV_DRAFT_KEY,
  emptyCv,
  emptyProfile,
  MAX_CV_PHOTO_SIZE,
  normalizeSkills,
  resizeCvPhoto,
  templates,
} from "./cv-utils";

export default function CvBuilderPage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [cv, setCv] = useState(emptyCv);
  const [photoError, setPhotoError] = useState("");
  const [status, setStatus] = useState(
    "Your draft is saved automatically in this browser.",
  );
  const [loaded, setLoaded] = useState(false);
  const [edited, setEdited] = useState(false);
  const photoInputRef = useRef(null);
  const isReorderedEntryLayout =
    cv.template === "modern" || cv.template === "minimal";

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
          const skills = Array.isArray(savedCv.skills)
            ? normalizeSkills(savedCv.skills)
            : [];
          const interests = Array.isArray(savedCv.interests)
            ? savedCv.interests
            : [];
          const references = Array.isArray(savedCv.references)
            ? savedCv.references.filter(
                (reference) => typeof reference === "string",
              )
            : [];

          setProfile({
            ...emptyProfile,
            ...savedProfile,
            hasDrivingLicense:
              savedProfile.hasDrivingLicense ??
              Boolean(savedProfile.drivingLicense),
          });
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
            interests,
            languages: Array.isArray(savedCv.languages)
              ? savedCv.languages
              : [],
            references,
          });
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
            cv,
          }),
        );
        setStatus("Draft saved automatically in this browser.");
      } catch (error) {
        console.error("Could not save CV draft:", error);
        setStatus("Could not save the draft in this browser.");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [cv, edited, loaded, profile]);

  function updateProfileField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setEdited(true);
  }

  function updateCvList(section, updateList) {
    setCv((current) => ({
      ...current,
      [section]: updateList(current[section]),
    }));
    setEdited(true);
  }

  function addEntry(section, entry) {
    updateCvList(section, (entries) => [...entries, entry]);
  }

  function updateEntry(section, index, field, value) {
    updateCvList(section, (entries) =>
      entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function removeEntry(section, index) {
    updateCvList(section, (entries) =>
      entries.filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    );
  }

  function updateTextList(section, index, value) {
    updateCvList(section, (items) =>
      items.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function addTextItem(section) {
    addEntry(section, "");
  }

  async function updatePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_CV_PHOTO_SIZE) {
      setPhotoError("The photo must be 5 MB or smaller.");
      return;
    }

    try {
      const photo = await resizeCvPhoto(file);
      setProfile((current) => ({ ...current, photo }));
      setPhotoError("");
      setEdited(true);
    } catch (error) {
      console.error("Could not process CV photo:", error);
      setPhotoError(error.message);
    }
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
            Your CV draft is saved in this browser. Download it as a PDF to keep
            a copy on your device.
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

        <div className="cv-template-picker" aria-label="Choose a CV template">
          <div className="cv-template-picker-heading">
            <strong>Choose a template</strong>
            <span>Your details stay the same when you switch styles.</span>
          </div>
          {templates.map((template) => (
            <button
              className={`cv-template-option ${cv.template === template.id ? "active" : ""}`}
              type="button"
              key={template.id}
              aria-pressed={cv.template === template.id}
              onClick={() => {
                setCv((current) => ({ ...current, template: template.id }));
                setEdited(true);
              }}
            >
              <span
                className={`cv-template-thumbnail cv-thumbnail-${template.id}`}
                aria-hidden="true"
              >
                <span className="cv-thumbnail-sidebar">
                  <span className="cv-thumbnail-avatar" />
                  <span className="cv-thumbnail-lines">
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <span className="cv-thumbnail-content">
                  <span className="cv-thumbnail-title" />
                  <span className="cv-thumbnail-subtitle" />
                  <span className="cv-thumbnail-section" />
                  <span className="cv-thumbnail-lines">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="cv-thumbnail-section" />
                  <span className="cv-thumbnail-lines">
                    <i />
                    <i />
                  </span>
                </span>
              </span>
              <span className="cv-template-option-copy">
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </span>
              <span className="cv-template-selected" aria-hidden="true">
                {cv.template === template.id ? "Selected" : "Select"}
              </span>
            </button>
          ))}
        </div>

        <CvDocument
          profile={profile}
          cv={cv}
          photoInputRef={photoInputRef}
          updatePhoto={updatePhoto}
          photoError={photoError}
          setProfile={setProfile}
          setEdited={setEdited}
          updateProfileField={updateProfileField}
          isReorderedEntryLayout={isReorderedEntryLayout}
          updateEntry={updateEntry}
          removeEntry={removeEntry}
          addEntry={addEntry}
          updateTextList={updateTextList}
          addTextItem={addTextItem}
        />
      </section>
    </main>
  );
}
