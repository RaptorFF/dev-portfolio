import Image from "next/image";
import {
  CvBulletListField,
  CvDateRange,
  CvInlineField,
  CvStarRating,
} from "./CvFields";
import {
  getContrastColor,
  hasAnyText,
  hasText,
  normalizeCvColors,
} from "./cv-utils";

function CvSkillsSection({
  skills,
  addEntry,
  updateEntry,
  removeEntry,
  template,
}) {
  return (
    <section
      className={`cv-document-skills-section ${
        skills.some((skill) => hasText(skill.name)) ? "" : "cv-print-empty"
      }`}
    >
      <h3>{template === "classic" ? "Key skills" : "Skills"}</h3>
      <div className="cv-document-skills">
        {skills.map((skill, index) => (
          <div
            className={`cv-document-skill ${
              hasText(skill.name) ? "" : "cv-print-empty"
            }`}
            key={`cv-skill-${index}`}
          >
            <CvInlineField
              label={`Skill ${index + 1}`}
              value={skill.name}
              onChange={(value) => updateEntry("skills", index, "name", value)}
              placeholder="Add a skill"
            />
            {template !== "classic" ? (
              <CvStarRating
                label={`${skill.name} skill level: ${skill.level || 3} of 5 stars`}
                level={skill.level || 3}
                onChange={(level) =>
                  updateEntry("skills", index, "level", level)
                }
              />
            ) : null}
            <button
              className="cv-document-remove"
              type="button"
              aria-label={`Remove skill ${index + 1}`}
              onClick={() => removeEntry("skills", index)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        className="cv-document-action"
        type="button"
        onClick={() => addEntry("skills", { name: "", level: 3 })}
      >
        + Add skill
      </button>
    </section>
  );
}

export default function CvDocument({
  profile,
  cv,
  photoInputRef,
  updatePhoto,
  photoError,
  setProfile,
  setEdited,
  updateProfileField,
  isReorderedEntryLayout,
  updateEntry,
  removeEntry,
  addEntry,
  updateTextList,
  addTextItem,
}) {
  const colors = normalizeCvColors(cv.colors);
  const hasContactDetails =
    cv.template === "classic"
      ? hasAnyText(profile.address, profile.phone, profile.email)
      : hasAnyText(
          profile.address,
          profile.phone,
          profile.email,
          profile.linkedin,
        ) || profile.hasDrivingLicense;

  return (
    <div
      className={`cv-layout cv-template-${cv.template}${
        cv.template === "classic" && !profile.photo
          ? " cv-template-classic-no-photo"
          : ""
      }`}
      style={{
        "--cv-classic-background": colors.classicBackground,
        "--cv-classic-foreground": getContrastColor(colors.classicBackground),
        "--cv-classic-section-background": colors.classicSectionBackground,
        "--cv-classic-section-foreground": getContrastColor(
          colors.classicSectionBackground,
          "#111827",
        ),
        "--cv-modern-sidebar-bg": colors.modernSidebar,
        "--cv-modern-sidebar-foreground": getContrastColor(
          colors.modernSidebar,
        ),
        "--cv-modern-main-bg": colors.modernMain,
        "--cv-modern-main-foreground": getContrastColor(colors.modernMain),
        "--cv-modern-main-heading": getContrastColor(
          colors.modernMain,
          "#263b5d",
        ),
        "--cv-modern-main-role": getContrastColor(
          colors.modernMain,
          "#315f8b",
        ),
        "--cv-modern-main-muted": getContrastColor(
          colors.modernMain,
          "#666672",
        ),
        "--cv-modern-main-placeholder": getContrastColor(
          colors.modernMain,
          "#8693a0",
        ),
        "--cv-minimal-header-bg": colors.minimalHeader,
        "--cv-minimal-header-foreground": getContrastColor(
          colors.minimalHeader,
        ),
        "--cv-minimal-sidebar-bg": colors.minimalSidebar,
        "--cv-minimal-sidebar-foreground": getContrastColor(
          colors.minimalSidebar,
          "#374151",
        ),
        "--cv-minimal-main-bg": colors.minimalMain,
        "--cv-minimal-main-foreground": getContrastColor(colors.minimalMain),
        "--cv-minimal-main-heading": getContrastColor(
          colors.minimalMain,
          "#374151",
        ),
        "--cv-minimal-main-muted": getContrastColor(
          colors.minimalMain,
          "#666672",
        ),
        "--cv-minimal-main-placeholder": getContrastColor(
          colors.minimalMain,
          "#8693a0",
        ),
        ...(cv.fontFamily ? { "--cv-font-family": cv.fontFamily } : {}),
      }}
    >
      <aside className="cv-document-panel" aria-label="Editable CV document">
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
              <section
                className={`cv-document-personal cv-document-contact ${
                  hasContactDetails ? "" : "cv-print-empty"
                }`}
              >
                <h3>
                  {cv.template === "minimal" ? "Contact" : "Personal details"}
                </h3>
                <div
                  className={hasText(profile.address) ? "" : "cv-print-empty"}
                >
                  <strong>Address</strong>
                  <CvInlineField
                    label="Address"
                    value={profile.address}
                    onChange={(value) => updateProfileField("address", value)}
                    placeholder="Add your address"
                  />
                </div>
                <div className={hasText(profile.phone) ? "" : "cv-print-empty"}>
                  <strong>Phone</strong>
                  <CvInlineField
                    label="Phone number"
                    value={profile.phone}
                    onChange={(value) => updateProfileField("phone", value)}
                    placeholder="Add your phone"
                  />
                </div>
                <div className={hasText(profile.email) ? "" : "cv-print-empty"}>
                  <strong>Email</strong>
                  <CvInlineField
                    label="Email address"
                    value={profile.email}
                    onChange={(value) => updateProfileField("email", value)}
                    placeholder="Add your email"
                    className="cv-inline-email"
                  />
                </div>
                <div
                  className={profile.hasDrivingLicense ? "" : "cv-print-empty"}
                >
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
                      className={
                        hasText(profile.drivingLicense) ? "" : "cv-print-empty"
                      }
                    />
                  ) : null}
                </div>
                <div
                  className={hasText(profile.linkedin) ? "" : "cv-print-empty"}
                >
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
              {cv.template === "minimal" ? (
                <CvSkillsSection
                  skills={cv.skills}
                  addEntry={addEntry}
                  updateEntry={updateEntry}
                  removeEntry={removeEntry}
                  template={cv.template}
                />
              ) : null}
              {cv.template === "modern" && (
                <section
                  className={`cv-document-interests ${
                    cv.interests.some(hasText) ? "" : "cv-print-empty"
                  }`}
                >
                  <h3>Interests</h3>
                  <ul>
                    {cv.interests.map((interest, index) => (
                      <li
                        className={hasText(interest) ? "" : "cv-print-empty"}
                        key={`cv-interest-${index}`}
                      >
                        <CvInlineField
                          label={`Interest ${index + 1}`}
                          value={interest}
                          onChange={(value) =>
                            updateTextList("interests", index, value)
                          }
                          placeholder="Add an interest"
                        />
                        <button
                          className="cv-document-remove"
                          type="button"
                          aria-label={`Remove interest ${index + 1}`}
                          onClick={() => removeEntry("interests", index)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="cv-document-action"
                    type="button"
                    onClick={() => addTextItem("interests")}
                  >
                    + Add interest
                  </button>
                </section>
              )}
              {cv.template !== "classic" ? (
                <section
                  className={`cv-document-languages ${
                    cv.languages.some((language) => hasText(language.name))
                      ? ""
                      : "cv-print-empty"
                  }`}
                >
                <h3>Languages</h3>
                {cv.languages.map((language, index) => (
                  <div
                    className={`cv-document-language ${
                      hasText(language.name) ? "" : "cv-print-empty"
                    }`}
                    key={`cv-language-${index}`}
                  >
                    <CvInlineField
                      label={`Language ${index + 1}`}
                      value={language.name || ""}
                      onChange={(value) =>
                        updateEntry("languages", index, "name", value)
                      }
                      placeholder="Add a language"
                    />
                    <CvStarRating
                      label={`${language.name || "Language"} level`}
                      level={language.level || 3}
                      onChange={(level) =>
                        updateEntry("languages", index, "level", level)
                      }
                    />
                    <button
                      className="cv-document-remove"
                      type="button"
                      aria-label={`Remove language ${index + 1}`}
                      onClick={() => removeEntry("languages", index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="cv-document-action"
                  type="button"
                  onClick={() => addEntry("languages", { name: "", level: 3 })}
                >
                  + Add language
                </button>
                </section>
              ) : null}
              {cv.template === "minimal" ? (
                <section
                  className={`cv-document-interests cv-document-references ${
                    cv.references.some(hasText) ? "" : "cv-print-empty"
                  }`}
                >
                  <h3>Reference</h3>
                  <ul>
                    {cv.references.map((reference, index) => (
                      <li
                        className={hasText(reference) ? "" : "cv-print-empty"}
                        key={`cv-reference-${index}`}
                      >
                        <CvInlineField
                          label={`Reference ${index + 1}`}
                          value={reference}
                          onChange={(value) =>
                            updateTextList("references", index, value)
                          }
                          placeholder="Add a reference's name and contact details"
                          multiline
                          className="cv-inline-description"
                        />
                        <button
                          className="cv-document-remove"
                          type="button"
                          aria-label={`Remove reference ${index + 1}`}
                          onClick={() => removeEntry("references", index)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="cv-document-action"
                    type="button"
                    onClick={() => addTextItem("references")}
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
              <section
                className={`cv-document-profile ${
                  hasText(profile.shortBio) ? "" : "cv-print-empty"
                }`}
              >
                <h3
                  className={
                    cv.template === "minimal"
                      ? "cv-document-section-heading"
                      : undefined
                  }
                >
                  {cv.template === "minimal" ? (
                    <>
                      <svg
                        className="cv-document-section-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                      </svg>
                      <span>Profile</span>
                    </>
                  ) : cv.template === "classic" ? (
                    "Summary"
                  ) : (
                    "About"
                  )}
                </h3>
                <CvInlineField
                  label="Professional summary in CV"
                  value={
                    typeof profile.shortBio === "string" &&
                    profile.shortBio.trim()
                      ? profile.shortBio
                      : ""
                  }
                  onChange={(value) => updateProfileField("shortBio", value)}
                  placeholder={
                    cv.template === "classic"
                      ? "Add your professional summary"
                      : cv.template === "minimal"
                        ? "Add a short profile about yourself"
                        : "Add something about yourself"
                  }
                  multiline
                  className="cv-inline-description"
                />
              </section>
              <section
                className={`cv-document-education ${
                  cv.education.some((entry) =>
                    hasAnyText(
                      entry.qualification,
                      entry.institution,
                      entry.startDate,
                      entry.endDate,
                      entry.description,
                    ),
                  )
                    ? ""
                    : "cv-print-empty"
                }`}
              >
                <h3
                  className={
                    cv.template === "minimal"
                      ? "cv-document-section-heading"
                      : undefined
                  }
                >
                  {cv.template === "minimal" ? (
                    <>
                      <svg
                        className="cv-document-section-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m2 10 10-5 10 5-10 5-10-5Z" />
                        <path d="M6 12v5c3.5 3 8.5 3 12 0v-5" />
                        <path d="M22 10v6" />
                      </svg>
                      <span>Education</span>
                    </>
                  ) : cv.template === "classic" ? (
                    "Education"
                  ) : (
                    "Education and qualification"
                  )}
                </h3>
                {cv.education.map((entry, index) => (
                  <div
                    className={`cv-document-entry ${
                      hasAnyText(
                        entry.qualification,
                        entry.institution,
                        entry.startDate,
                        entry.endDate,
                        entry.description,
                      )
                        ? ""
                        : "cv-print-empty"
                    }`}
                    key={`cv-edu-${index}`}
                  >
                    <div className="cv-document-entry-primary">
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
                        className={
                          isReorderedEntryLayout ? "" : "cv-inline-strong"
                        }
                      />
                      <CvInlineField
                        label={`Education institution ${index + 1}`}
                        value={entry.institution}
                        onChange={(value) =>
                          updateEntry("education", index, "institution", value)
                        }
                        placeholder="Add institution"
                        wrap={cv.template === "minimal"}
                        className={
                          isReorderedEntryLayout
                            ? "cv-inline-institution cv-inline-strong"
                            : ""
                        }
                      />
                    </div>
                    <CvDateRange
                      className={
                        hasAnyText(entry.startDate, entry.endDate)
                          ? ""
                          : "cv-print-empty"
                      }
                      startLabel={`Education start date ${index + 1}`}
                      startValue={entry.startDate}
                      onStartChange={(value) =>
                        updateEntry("education", index, "startDate", value)
                      }
                      endLabel={`Education end date ${index + 1}`}
                      endValue={entry.endDate}
                      onEndChange={(value) =>
                        updateEntry("education", index, "endDate", value)
                      }
                    />
                    <CvInlineField
                      label={`Education details ${index + 1}`}
                      value={entry.description}
                      onChange={(value) =>
                        updateEntry("education", index, "description", value)
                      }
                      placeholder="Add your education details or achievements"
                      multiline
                      className={`cv-inline-description cv-education-description ${
                        hasText(entry.description) ? "" : "cv-print-empty"
                      }`}
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
              {cv.template !== "minimal" ? (
                <CvSkillsSection
                  skills={cv.skills}
                  addEntry={addEntry}
                  updateEntry={updateEntry}
                  removeEntry={removeEntry}
                  template={cv.template}
                />
              ) : null}
              <section
                className={`cv-document-experience ${
                  cv.experience.some((entry) =>
                    hasAnyText(
                      entry.title,
                      entry.organization,
                      entry.startDate,
                      entry.endDate,
                      entry.description,
                    ),
                  )
                    ? ""
                    : "cv-print-empty"
                }`}
              >
                <h3
                  className={
                    cv.template === "minimal"
                      ? "cv-document-section-heading"
                      : undefined
                  }
                >
                  {cv.template === "minimal" ? (
                    <>
                      <svg
                        className="cv-document-section-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="7" width="18" height="14" rx="2" />
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M3 12h18M10 12v2h4v-2" />
                      </svg>
                      <span>Experience</span>
                    </>
                  ) : (
                    "Work experience"
                  )}
                </h3>
                {cv.experience.map((entry, index) => (
                  <div
                    className={`cv-document-entry ${
                      hasAnyText(
                        entry.title,
                        entry.organization,
                        entry.startDate,
                        entry.endDate,
                        entry.description,
                      )
                        ? ""
                        : "cv-print-empty"
                    }`}
                    key={`cv-exp-${index}`}
                  >
                    <div className="cv-document-entry-primary">
                      <CvInlineField
                        label={`Job title ${index + 1}`}
                        value={entry.title}
                        onChange={(value) =>
                          updateEntry("experience", index, "title", value)
                        }
                        placeholder="Add job title"
                        className={
                          isReorderedEntryLayout ? "" : "cv-inline-strong"
                        }
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
                        wrap={cv.template === "minimal"}
                        className={
                          isReorderedEntryLayout
                            ? "cv-inline-organization cv-inline-strong"
                            : cv.template === "classic"
                              ? "cv-inline-strong"
                              : ""
                        }
                      />
                    </div>
                    <CvDateRange
                      className={
                        hasAnyText(entry.startDate, entry.endDate)
                          ? ""
                          : "cv-print-empty"
                      }
                      startLabel={`Work start date ${index + 1}`}
                      startValue={entry.startDate}
                      onStartChange={(value) =>
                        updateEntry("experience", index, "startDate", value)
                      }
                      endLabel={`Work end date ${index + 1}`}
                      endValue={entry.endDate}
                      onEndChange={(value) =>
                        updateEntry("experience", index, "endDate", value)
                      }
                    />
                    <CvBulletListField
                      label={`Work experience details ${index + 1}`}
                      value={entry.description}
                      onChange={(value) =>
                        updateEntry("experience", index, "description", value)
                      }
                      placeholder="Add your responsibilities and achievements"
                      className={
                        hasText(entry.description) ? "" : "cv-print-empty"
                      }
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
  );
}
