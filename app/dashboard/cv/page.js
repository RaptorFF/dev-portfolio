"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  references: [],
};
const CV_DRAFT_KEY = "portfolio-forge-cv-draft-v1";
const MAX_CV_PHOTO_SIZE = 5 * 1024 * 1024;

const templates = [
  {
    id: "modern",
    label: "Blue & Gray",
    description: "A confident two-column layout with a slate gray sidebar.",
  },
  {
    id: "classic",
    label: "Clean Professional",
    description: "A balanced, traditional layout with refined blue accents.",
  },
  {
    id: "minimal",
    label: "Slate & Gray",
    description: "A two-column layout with a slate header and dark gray sidebar.",
  },
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

function CvInlineField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  multiline = false,
}) {
  const fieldProps = {
    className: `cv-inline-field ${className}`,
    "aria-label": label,
    value,
    onChange: (event) => onChange(event.target.value),
    placeholder,
  };

  return multiline ? (
    <textarea {...fieldProps} rows={3} />
  ) : (
    <input {...fieldProps} />
  );
}

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

  function updateInterest(index, value) {
    const interests = [...cv.interests];
    interests[index] = value;
    setCv((current) => ({ ...current, interests }));
    setEdited(true);
  }

  function addInterest() {
    const interests = [...cv.interests, ""];
    setCv((current) => ({ ...current, interests }));
    setEdited(true);
  }

  function removeInterest(index) {
    const interests = cv.interests.filter(
      (_, interestIndex) => interestIndex !== index,
    );
    setCv((current) => ({ ...current, interests }));
    setEdited(true);
  }

  function updateReference(index, value) {
    const references = [...cv.references];
    references[index] = value;
    setCv((current) => ({ ...current, references }));
    setEdited(true);
  }

  function addReference() {
    setCv((current) => ({
      ...current,
      references: [...current.references, ""],
    }));
    setEdited(true);
  }

  function removeReference(index) {
    setCv((current) => ({
      ...current,
      references: current.references.filter(
        (_, referenceIndex) => referenceIndex !== index,
      ),
    }));
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

  function renderSkillsSection() {
    return (
      <section className="cv-document-skills-section">
        <h3>Skills</h3>
        <div className="cv-document-skills">
          {cv.skills.map((skill, index) => (
            <div className="cv-document-skill" key={`cv-skill-${index}`}>
              <CvInlineField
                label={`Skill ${index + 1}`}
                value={skill.name}
                onChange={(value) => updateSkill(index, "name", value)}
                placeholder="Add a skill"
              />
              <CvStarRating
                label={`${skill.name} skill level: ${skill.level || 3} of 5 stars`}
                level={skill.level || 3}
                onChange={(level) => updateSkill(index, "level", level)}
              />
              <button
                className="cv-document-remove"
                type="button"
                aria-label={`Remove skill ${index + 1}`}
                onClick={() => removeSkill(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          className="cv-document-action"
          type="button"
          onClick={addSkill}
        >
          + Add skill
        </button>
      </section>
    );
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

        <div className={`cv-layout cv-template-${cv.template}`}>
          <aside
            className="cv-document-panel"
            aria-label="Editable CV document"
          >
            <article className="cv-document">
              <div className="cv-document-columns">
                <aside className="cv-document-sidebar">
                  <div className="cv-document-photo">
                    {profile.photo ? (
                      <Image
                        src={profile.photo}
                        alt={`${profile.name || "Profile"} portrait`}
                        width={160}
                        height={160}
                        unoptimized
                      />
                    ) : (
                      <span className="cv-document-photo-placeholder">
                        Add photo
                      </span>
                    )}
                    <input
                      ref={photoInputRef}
                      className="cv-photo-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label="Choose profile photo"
                      onChange={updatePhoto}
                    />
                    <button
                      className="cv-document-action cv-photo-action"
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {profile.photo ? "Change photo" : "Upload photo"}
                    </button>
                    {profile.photo ? (
                      <button
                        className="cv-document-action cv-photo-action"
                        type="button"
                        onClick={() => {
                          setProfile((current) => ({ ...current, photo: "" }));
                          setEdited(true);
                        }}
                      >
                        Remove photo
                      </button>
                    ) : null}
                    {photoError ? (
                      <span className="cv-error-text" role="alert">
                        {photoError}
                      </span>
                    ) : null}
                  </div>
                  <section className="cv-document-personal cv-document-contact">
                    <h3>
                      {cv.template === "minimal" ? "Contact" : "Personal details"}
                    </h3>
                    <div>
                      <strong>Address</strong>
                      <CvInlineField
                        label="Address"
                        value={profile.address}
                        onChange={(value) =>
                          updateProfileField("address", value)
                        }
                        placeholder="Add your address"
                      />
                    </div>
                    <div>
                      <strong>Phone</strong>
                      <CvInlineField
                        label="Phone number"
                        value={profile.phone}
                        onChange={(value) => updateProfileField("phone", value)}
                        placeholder="Add your phone"
                      />
                    </div>
                    <div>
                      <strong>Email</strong>
                      <CvInlineField
                        label="Email address"
                        value={profile.email}
                        onChange={(value) => updateProfileField("email", value)}
                        placeholder="Add your email"
                        className="cv-inline-email"
                      />
                    </div>
                    <div>
                      <strong>Driving license</strong>
                      <label className="cv-inline-license">
                        <input
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
                        <span>I have a driving license</span>
                      </label>
                      {profile.hasDrivingLicense ? (
                        <CvInlineField
                          label="Driving license categories"
                          value={profile.drivingLicense}
                          onChange={(value) =>
                            updateProfileField("drivingLicense", value)
                          }
                          placeholder="Categories"
                        />
                      ) : null}
                    </div>
                    <div>
                      <strong>LinkedIn</strong>
                      <div className="cv-inline-link">
                        <CvInlineField
                          label="LinkedIn profile URL"
                          value={profile.linkedin}
                          onChange={(value) =>
                            updateProfileField("linkedin", value)
                          }
                          placeholder="Add LinkedIn URL"
                          className="cv-inline-email"
                        />
                        {profile.linkedin ? (
                          <a
                            href={profile.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open LinkedIn profile"
                          >
                            Open
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </section>
                  {cv.template === "minimal" ? renderSkillsSection() : null}
                  {cv.template !== "minimal" && (
                    <section className="cv-document-interests">
                      <h3>Interests</h3>
                      <ul>
                        {cv.interests.map((interest, index) => (
                          <li key={`cv-interest-${index}`}>
                            <CvInlineField
                              label={`Interest ${index + 1}`}
                              value={interest}
                              onChange={(value) =>
                                updateInterest(index, value)
                              }
                              placeholder="Add an interest"
                            />
                            <button
                              className="cv-document-remove"
                              type="button"
                              aria-label={`Remove interest ${index + 1}`}
                              onClick={() => removeInterest(index)}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        className="cv-document-action"
                        type="button"
                        onClick={addInterest}
                      >
                        + Add interest
                      </button>
                    </section>
                  )}
                  <section className="cv-document-languages">
                    <h3>Languages</h3>
                    {cv.languages.map((language, index) => (
                      <div
                        className="cv-document-language"
                        key={`cv-language-${index}`}
                      >
                        <CvInlineField
                          label={`Language ${index + 1}`}
                          value={language.name || ""}
                          onChange={(value) =>
                            updateLanguage(index, "name", value)
                          }
                          placeholder="Add a language"
                        />
                        <CvStarRating
                          label={`${language.name || "Language"} level`}
                          level={language.level || 3}
                          onChange={(level) =>
                            updateLanguage(index, "level", level)
                          }
                        />
                        <button
                          className="cv-document-remove"
                          type="button"
                          aria-label={`Remove language ${index + 1}`}
                          onClick={() => removeLanguage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      className="cv-document-action"
                      type="button"
                      onClick={addLanguage}
                    >
                      + Add language
                    </button>
                  </section>
                  {cv.template === "minimal" ? (
                    <section className="cv-document-interests cv-document-references">
                      <h3>Reference</h3>
                      <ul>
                        {cv.references.map((reference, index) => (
                          <li key={`cv-reference-${index}`}>
                            <CvInlineField
                              label={`Reference ${index + 1}`}
                              value={reference}
                              onChange={(value) =>
                                updateReference(index, value)
                              }
                              placeholder="Name and contact details"
                              multiline
                              className="cv-inline-description"
                            />
                            <button
                              className="cv-document-remove"
                              type="button"
                              aria-label={`Remove reference ${index + 1}`}
                              onClick={() => removeReference(index)}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        className="cv-document-action"
                        type="button"
                        onClick={addReference}
                      >
                        + Add reference
                      </button>
                    </section>
                  ) : null}
                </aside>
                <div className="cv-document-main">
                  <header className="cv-document-header">
                    <h2>
                      <CvInlineField
                        label="Full name in CV"
                        value={profile.name}
                        onChange={(value) => updateProfileField("name", value)}
                        placeholder="Your name"
                        className="cv-inline-name"
                      />
                    </h2>
                    <h3>
                      <CvInlineField
                        label="Professional title in CV"
                        value={profile.role}
                        onChange={(value) => updateProfileField("role", value)}
                        placeholder="Your professional title"
                        className="cv-inline-role"
                      />
                    </h3>
                  </header>
                  <section className="cv-document-profile">
                    <h3>{cv.template === "minimal" ? "Profile" : "About"}</h3>
                    <CvInlineField
                      label="Professional summary in CV"
                      value={
                        typeof profile.shortBio === "string" &&
                        profile.shortBio.trim()
                          ? profile.shortBio
                          : ""
                      }
                      onChange={(value) =>
                        updateProfileField("shortBio", value)
                      }
                      placeholder="Add something about yourself"
                      multiline
                      className="cv-inline-description"
                    />
                  </section>
                  <section className="cv-document-education">
                    <h3>
                      {cv.template === "minimal"
                        ? "Education"
                        : "Education and qualification"}
                    </h3>
                    {cv.education.map((entry, index) => (
                        <div
                          className="cv-document-entry"
                          key={`cv-edu-${index}`}
                        >
                          <div>
                            <CvInlineField
                              label={`Education qualification ${index + 1}`}
                              value={entry.qualification}
                              onChange={(value) =>
                                updateEntry(
                                  "education",
                                  index,
                                  "qualification",
                                  value,
                                )
                              }
                              placeholder="Add qualification"
                              className="cv-inline-strong"
                            />
                            <CvInlineField
                              label={`Education institution ${index + 1}`}
                              value={entry.institution}
                              onChange={(value) =>
                                updateEntry(
                                  "education",
                                  index,
                                  "institution",
                                  value,
                                )
                              }
                              placeholder="Add institution"
                            />
                          </div>
                          <div className="cv-document-dates">
                            <CvInlineField
                              label={`Education start date ${index + 1}`}
                              value={entry.startDate}
                              onChange={(value) =>
                                updateEntry("education", index, "startDate", value)
                              }
                              placeholder="From"
                            />
                            <span>–</span>
                            <CvInlineField
                              label={`Education end date ${index + 1}`}
                              value={entry.endDate}
                              onChange={(value) =>
                                updateEntry("education", index, "endDate", value)
                              }
                              placeholder="To"
                            />
                          </div>
                          <CvInlineField
                            label={`Education details ${index + 1}`}
                            value={entry.description}
                            onChange={(value) =>
                              updateEntry(
                                "education",
                                index,
                                "description",
                                value,
                              )
                            }
                            placeholder="Add details"
                            multiline
                            className="cv-inline-description"
                          />
                          <button
                            className="cv-document-remove cv-entry-remove"
                            type="button"
                            onClick={() => removeEntry("education", index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    <button
                      className="cv-document-action"
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
                      + Add education
                    </button>
                  </section>
                  {cv.template !== "minimal" ? renderSkillsSection() : null}
                  <section className="cv-document-experience">
                    <h3>
                      {cv.template === "minimal"
                        ? "Experience"
                        : "Work experience"}
                    </h3>
                    {cv.experience.map((entry, index) => (
                        <div
                          className="cv-document-entry"
                          key={`cv-exp-${index}`}
                        >
                          <div>
                            <CvInlineField
                              label={`Job title ${index + 1}`}
                              value={entry.title}
                              onChange={(value) =>
                                updateEntry("experience", index, "title", value)
                              }
                              placeholder="Add job title"
                              className="cv-inline-strong"
                            />
                            <CvInlineField
                              label={`Company ${index + 1}`}
                              value={entry.organization}
                              onChange={(value) =>
                                updateEntry(
                                  "experience",
                                  index,
                                  "organization",
                                  value,
                                )
                              }
                              placeholder="Add company"
                            />
                          </div>
                          <div className="cv-document-dates">
                            <CvInlineField
                              label={`Work start date ${index + 1}`}
                              value={entry.startDate}
                              onChange={(value) =>
                                updateEntry("experience", index, "startDate", value)
                              }
                              placeholder="From"
                            />
                            <span>–</span>
                            <CvInlineField
                              label={`Work end date ${index + 1}`}
                              value={entry.endDate}
                              onChange={(value) =>
                                updateEntry("experience", index, "endDate", value)
                              }
                              placeholder="To"
                            />
                          </div>
                          <CvInlineField
                            label={`Work experience details ${index + 1}`}
                            value={entry.description}
                            onChange={(value) =>
                              updateEntry(
                                "experience",
                                index,
                                "description",
                                value,
                              )
                            }
                            placeholder="Add role details"
                            multiline
                            className="cv-inline-description"
                          />
                          <button
                            className="cv-document-remove cv-entry-remove"
                            type="button"
                            onClick={() => removeEntry("experience", index)}
                          >
                            Remove
                          </button>
                        </div>
                    ))}
                    <button
                      className="cv-document-action"
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
                      + Add experience
                    </button>
                  </section>
                </div>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
