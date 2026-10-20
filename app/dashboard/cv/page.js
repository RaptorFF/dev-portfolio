"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Component to build and manage the user's CV, including profile, experience, education, and skills

const emptyProfile = {
  name: "",
  role: "",
  email: "",
  shortBio: "",
  photo: "",
  address: "",
  phone: "",
  drivingLicense: "",
  hasDrivingLicense: false,
  linkedin: "",
};
const emptyCv = {
  template: "modern",
  experience: [],
  education: [],
  skills: [],
  interests: [],
  languages: [],
};
const CV_DRAFT_KEY = "portfolio-forge-cv-draft-v1";
const MAX_CV_PHOTO_SIZE = 5 * 1024 * 1024;

const templates = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
];

function resizeCvPhoto(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      try {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not process the selected photo.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not process the selected photo."));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () =>
              reject(reader.error || new Error("Could not read the selected photo."));
            reader.readAsDataURL(blob);
          },
          "image/webp",
          0.82,
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file is not a valid image."));
    };
    image.src = objectUrl;
  });
}

function normalizeSkills(skills) {
  return skills
    .map((skill) =>
      typeof skill === "string"
        ? { name: skill, level: 3 }
        : {
            name: typeof skill?.name === "string" ? skill.name : "",
            level: Math.min(5, Math.max(1, Number(skill?.level) || 3)),
          },
    )
    .filter((skill) => skill.name);
}

function parseInterests(value) {
  return value
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);
}

function CvStarRating({ level, label, onChange }) {
  return (
    <div className="cv-star-rating" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) =>
        onChange ? (
          <button
            className={star <= level ? "active" : ""}
            type="button"
            key={star}
            aria-label={`${star} of 5 stars`}
            aria-pressed={star === level}
            onClick={() => onChange(star)}
          >
            {star <= level ? "★" : "☆"}
          </button>
        ) : (
          <span
            className={star <= level ? "active" : ""}
            key={star}
            aria-hidden="true"
          >
            {star <= level ? "★" : "☆"}
          </span>
        ),
      )}
    </div>
  );
}

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
  const [interestsText, setInterestsText] = useState("");
  const [photoError, setPhotoError] = useState("");
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
          const skills = Array.isArray(savedCv.skills)
            ? normalizeSkills(savedCv.skills)
            : [];
          const interests = Array.isArray(savedCv.interests)
            ? savedCv.interests
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
          });
          setInterestsText(interests.join(", "));
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
            cv: { ...cv, interests: parseInterests(interestsText) },
          }),
        );
        setStatus("Draft saved automatically in this browser.");
      } catch (error) {
        console.error("Could not save CV draft:", error);
        setStatus("Could not save the draft in this browser.");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [cv, edited, interestsText, loaded, profile]);

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
      [section]: current[section].filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    }));
    setEdited(true);
  }

  function updateInterests(value) {
    setInterestsText(value);
    setEdited(true);
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

  function updateSkill(index, field, value) {
    setCv((current) => ({
      ...current,
      skills: current.skills.map((skill, skillIndex) =>
        skillIndex === index ? { ...skill, [field]: value } : skill,
      ),
    }));
    setEdited(true);
  }

  function addSkill() {
    setCv((current) => ({
      ...current,
      skills: [...current.skills, { name: "", level: 3 }],
    }));
    setEdited(true);
  }

  function removeSkill(index) {
    setCv((current) => ({
      ...current,
      skills: current.skills.filter((_, skillIndex) => skillIndex !== index),
    }));
    setEdited(true);
  }

  function addLanguage() {
    setCv((current) => ({
      ...current,
      languages: [...current.languages, { name: "", level: 3 }],
    }));
    setEdited(true);
  }

  function updateLanguage(index, field, value) {
    setCv((current) => ({
      ...current,
      languages: current.languages.map((language, languageIndex) =>
        languageIndex === index
          ? { ...language, [field]: value }
          : language,
      ),
    }));
    setEdited(true);
  }

  function removeLanguage(index) {
    setCv((current) => ({
      ...current,
      languages: current.languages.filter(
        (_, languageIndex) => languageIndex !== index,
      ),
    }));
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
          <div className="cv-editor-column">
            <article className="editor-card cv-editor-card">
              <h2>Name and title</h2>
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
              </div>
            </article>

            <article className="editor-card cv-editor-card">
              <h2>Personal details</h2>
              <div className="cv-photo-editor">
                {profile.photo ? (
                  <Image
                    className="cv-photo-editor-preview"
                    src={profile.photo}
                    alt="CV profile"
                    width={96}
                    height={96}
                    unoptimized
                  />
                ) : (
                  <div className="cv-photo-editor-placeholder">Photo</div>
                )}
                <div className="cv-photo-controls">
                  <label className="mock-field">
                    <span>Profile photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={updatePhoto}
                    />
                  </label>
                  <span className="cv-help-text">
                    JPG, PNG or WebP, up to 5 MB.
                  </span>
                  {photoError ? (
                    <span className="cv-error-text" role="alert">
                      {photoError}
                    </span>
                  ) : null}
                  {profile.photo ? (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setProfile((current) => ({ ...current, photo: "" }));
                        setEdited(true);
                      }}
                    >
                      Remove photo
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="cv-profile-grid">
                <label className="mock-field">
                  <span>Address</span>
                  <input
                    name="address"
                    value={profile.address}
                    onChange={updateProfile}
                    maxLength={250}
                    placeholder="Street, city, country"
                  />
                </label>
                <label className="mock-field">
                  <span>Phone number</span>
                  <input
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={updateProfile}
                    maxLength={50}
                    placeholder="+381 60 123 4567"
                  />
                </label>
                <label className="mock-field">
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={updateProfile}
                    maxLength={200}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="mock-field cv-license-toggle">
                  <span>Driving license</span>
                  <span className="cv-checkbox-row">
                    <input
                      name="hasDrivingLicense"
                      type="checkbox"
                      checked={profile.hasDrivingLicense}
                      onChange={(event) => {
                        setProfile((current) => ({
                          ...current,
                          hasDrivingLicense: event.target.checked,
                        }));
                        setEdited(true);
                      }}
                    />
                    I have a driving license
                  </span>
                </label>
                {profile.hasDrivingLicense ? (
                  <label className="mock-field">
                    <span>Categories (optional)</span>
                    <input
                      name="drivingLicense"
                      value={profile.drivingLicense}
                      onChange={updateProfile}
                      maxLength={80}
                      placeholder="e.g. B, AM"
                    />
                  </label>
                ) : null}
                <label className="mock-field cv-summary-field">
                  <span>LinkedIn or other link</span>
                  <input
                    name="linkedin"
                    type="url"
                    value={profile.linkedin}
                    onChange={updateProfile}
                    maxLength={300}
                    placeholder="https://linkedin.com/in/your-name"
                  />
                </label>
              </div>
            </article>

            <article className="editor-card cv-editor-card">
              <h2>About</h2>
              <label className="mock-field">
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
            </article>

            <article className="editor-card cv-editor-card">
              <h2>Interests</h2>
              <label className="mock-field">
                <span>Separate interests with commas</span>
                <textarea
                  value={interestsText}
                  onChange={(event) => updateInterests(event.target.value)}
                  rows={2}
                  placeholder="Sport, cooking, reading"
                />
              </label>
            </article>

            <article className="editor-card cv-editor-card">
              <div className="cv-section-heading">
                <div>
                  <h2>Languages</h2>
                  <p>Add the languages you know and rate your level.</p>
                </div>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={addLanguage}
                >
                  Add language
                </button>
              </div>
              {cv.languages.map((language, index) => (
                <article className="cv-rated-entry" key={`language-${index}`}>
                  <label className="mock-field">
                    <span>Language</span>
                    <input
                      value={language.name || ""}
                      onChange={(event) =>
                        updateLanguage(index, "name", event.target.value)
                      }
                      maxLength={80}
                      placeholder="e.g. English"
                    />
                  </label>
                  <div className="cv-rating-field">
                    <span>Level</span>
                    <CvStarRating
                      label={`Language level for ${language.name || "language"}`}
                      level={language.level || 3}
                      onChange={(level) =>
                        updateLanguage(index, "level", level)
                      }
                    />
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => removeLanguage(index)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </article>

            <article className="editor-card cv-editor-card">
              <div className="cv-section-heading">
                <div>
                  <h2>Education and qualification</h2>
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
              <div className="cv-section-heading">
                <div>
                  <h2>Skills</h2>
                  <p>Add your skills and rate your level.</p>
                </div>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={addSkill}
                >
                  Add skill
                </button>
              </div>
              {cv.skills.map((skill, index) => (
                <article className="cv-rated-entry" key={`skill-${index}`}>
                  <label className="mock-field">
                    <span>Skill</span>
                    <input
                      value={skill.name || ""}
                      onChange={(event) =>
                        updateSkill(index, "name", event.target.value)
                      }
                      maxLength={100}
                      placeholder="e.g. React"
                    />
                  </label>
                  <div className="cv-rating-field">
                    <span>Level</span>
                    <CvStarRating
                      label={`Skill level for ${skill.name || "skill"}`}
                      level={skill.level || 3}
                      onChange={(level) =>
                        updateSkill(index, "level", level)
                      }
                    />
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => removeSkill(index)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </article>

            <article className="editor-card cv-editor-card">
              <div className="cv-section-heading">
                <div>
                  <h2>Work experience</h2>
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
          </div>

          <aside
            className="preview-panel cv-preview-column"
            aria-label="CV live preview"
          >
            <div className="cv-preview-heading">
              <p className="section-kicker">Live preview</p>
              <h2>Your CV</h2>
            </div>
            <article className="cv-document">
              <div className="cv-document-columns">
                <aside className="cv-document-sidebar">
                  {profile.photo ? (
                    <div className="cv-document-photo">
                      <Image
                        src={profile.photo}
                        alt={`${profile.name || "Profile"} portrait`}
                        width={160}
                        height={160}
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <section className="cv-document-personal">
                    <h3>Personal details</h3>
                    {profile.address ? (
                      <div>
                        <strong>Address</strong>
                        <p>{profile.address}</p>
                      </div>
                    ) : null}
                    {profile.phone ? (
                      <div>
                        <strong>Phone</strong>
                        <p>{profile.phone}</p>
                      </div>
                    ) : null}
                    {profile.email ? (
                      <div>
                        <strong>Email</strong>
                        <p className="cv-document-email">{profile.email}</p>
                      </div>
                    ) : null}
                    {profile.hasDrivingLicense ? (
                      <div>
                        <strong>Driving license</strong>
                        <p>{profile.drivingLicense || "Yes"}</p>
                      </div>
                    ) : null}
                    {profile.linkedin ? (
                      <div>
                        <strong>LinkedIn</strong>
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {profile.linkedin.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    ) : null}
                  </section>
                  {cv.interests.length ? (
                    <section className="cv-document-interests">
                      <h3>Interests</h3>
                      <ul>
                        {cv.interests.map((interest, index) => (
                          <li key={`cv-interest-${index}`}>{interest}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {cv.languages.some((language) => language.name) ? (
                    <section className="cv-document-languages">
                      <h3>Languages</h3>
                      {cv.languages
                        .filter((language) => language.name)
                        .map((language, index) => (
                          <div
                            className="cv-document-language"
                            key={`cv-language-${index}`}
                          >
                            <span>{language.name}</span>
                            <CvStarRating
                              label={`${language.name} language level: ${language.level || 3} of 5 stars`}
                              level={language.level || 3}
                            />
                          </div>
                        ))}
                    </section>
                  ) : null}
                </aside>
                <div className="cv-document-main">
                  <header className="cv-document-header">
                    <p className="cv-document-eyebrow">Curriculum vitae</p>
                    <h2>{profile.name || "Your Name"}</h2>
                    {profile.role ? <h3>{profile.role}</h3> : null}
                  </header>
                  {profile.shortBio ? (
                    <section>
                      <h3>About</h3>
                      <p>{profile.shortBio}</p>
                    </section>
                  ) : null}
                  {cv.education.length ? (
                    <section>
                      <h3>Education and qualification</h3>
                      {cv.education.map((entry, index) => (
                        <div
                          className="cv-document-entry"
                          key={`cv-edu-${index}`}
                        >
                          <div>
                            <strong>
                              {entry.qualification || "Qualification"}
                            </strong>
                            {entry.institution ? (
                              <span>{entry.institution}</span>
                            ) : null}
                          </div>
                          <span>
                            {[entry.startDate, entry.endDate]
                              .filter(Boolean)
                              .join(" – ")}
                          </span>
                          {entry.description ? <p>{entry.description}</p> : null}
                        </div>
                      ))}
                    </section>
                  ) : null}
                  {cv.skills.some((skill) => skill.name) ? (
                    <section>
                      <h3>Skills</h3>
                      <div className="cv-document-skills">
                        {cv.skills
                          .filter((skill) => skill.name)
                          .map((skill, index) => (
                            <div
                              className="cv-document-skill"
                              key={`cv-skill-${index}`}
                            >
                              <span>{skill.name}</span>
                              <CvStarRating
                                label={`${skill.name} skill level: ${skill.level || 3} of 5 stars`}
                                level={skill.level || 3}
                              />
                            </div>
                          ))}
                      </div>
                    </section>
                  ) : null}
                  {cv.experience.length ? (
                    <section>
                      <h3>Work experience</h3>
                      {cv.experience.map((entry, index) => (
                        <div
                          className="cv-document-entry"
                          key={`cv-exp-${index}`}
                        >
                          <div>
                            <strong>{entry.title || "Job title"}</strong>
                            {entry.organization ? (
                              <span>{entry.organization}</span>
                            ) : null}
                          </div>
                          <span>
                            {[entry.startDate, entry.endDate]
                              .filter(Boolean)
                              .join(" – ")}
                          </span>
                          {entry.description ? <p>{entry.description}</p> : null}
                        </div>
                      ))}
                    </section>
                  ) : null}
                </div>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
