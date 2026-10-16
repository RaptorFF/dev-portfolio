import { useState } from "react";
import ProfileAvatar from "../../components/profile-avatar";

const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;

function resizeAvatar(file) {
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
        if (!context) throw new Error("Slika ne može da se obradi.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Slika ne može da se obradi."));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () =>
              reject(reader.error || new Error("Slika ne može da se učita."));
            reader.readAsDataURL(blob);
          },
          "image/webp",
          0.85,
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Izabrana datoteka nije ispravna slika."));
    };
    image.src = objectUrl;
  });
}

const entryFields = {
  experience: [
    { name: "role", label: "Position", placeholder: "e.g. Frontend Developer" },
    { name: "company", label: "Company", placeholder: "e.g. Acme Inc." },
  ],
  education: [
    { name: "degree", label: "Degree or course", placeholder: "e.g. BSc Computer Science" },
    { name: "school", label: "School", placeholder: "e.g. University name" },
  ],
};

function ProfileEntryEditor({
  collection,
  entries,
  onChange,
  onAdd,
  onRemove,
}) {
  const fields = entryFields[collection];
  const safeEntries = Array.isArray(entries) ? entries : [];
  const title = collection === "experience" ? "Experience" : "Education";

  return (
    <section className="profile-list-editor">
      <div className="profile-list-heading">
        <h3>{title}</h3>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => onAdd(collection)}
        >
          Add {collection === "experience" ? "experience" : "education"}
        </button>
      </div>
      {safeEntries.map((entry, index) => (
        <div className="profile-entry-editor" key={`${collection}-${index}`}>
          <div className="profile-entry-grid">
            {fields.map((field) => (
              <div className="mock-field" key={field.name}>
                <label htmlFor={`${collection}-${index}-${field.name}`}>
                  {field.label}
                </label>
                <input
                  id={`${collection}-${index}-${field.name}`}
                  name={field.name}
                  value={entry[field.name] || ""}
                  onChange={(event) => onChange(collection, index, event)}
                  placeholder={field.placeholder}
                  maxLength={120}
                />
              </div>
            ))}
          </div>
          <div className="profile-entry-grid">
            <div className="mock-field">
              <label htmlFor={`${collection}-${index}-period`}>Period</label>
              <input
                id={`${collection}-${index}-period`}
                name="period"
                value={entry.period || ""}
                onChange={(event) => onChange(collection, index, event)}
                placeholder="e.g. 2022 – Present"
                maxLength={80}
              />
            </div>
            <div className="mock-field">
              <label htmlFor={`${collection}-${index}-description`}>
                Details
              </label>
              <textarea
                id={`${collection}-${index}-description`}
                name="description"
                value={entry.description || ""}
                onChange={(event) => onChange(collection, index, event)}
                placeholder="A short description (optional)"
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
          <button
            type="button"
            className="button button-secondary profile-remove-button"
            onClick={() => onRemove(collection, index)}
          >
            Remove
          </button>
        </div>
      ))}
    </section>
  );
}

export default function ProfileEditor({
  profile,
  githubFallback,
  skillsText,
  onChange,
  onAvatarChange,
  onRemoveAvatar,
  onSkillsChange,
  onSocialLinkChange,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
}) {
  const [githubLinkEdited, setGithubLinkEdited] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const safeProfile = {
    name: "",
    role: "",
    shortBio: "",
    email: "",
    avatarUrl: "",
    avatarImage: "",
    skills: [],
    experience: [],
    education: [],
    links: {},
    ...profile,
  };
  const avatarInitials =
    safeProfile.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "?";

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Izaberi JPG, PNG ili WebP sliku.");
      return;
    }
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setAvatarError("Slika mora biti manja od 5 MB.");
      return;
    }

    try {
      const imageData = await resizeAvatar(file);
      onAvatarChange(imageData);
      setAvatarError("");
    } catch (error) {
      console.error("Profile photo processing failed:", error);
      setAvatarError("Slika nije mogla da se obradi. Pokušaj ponovo.");
    }
  }

  return (
    <article className="editor-card" id="profile">
      <h2>Profile setup</h2>
      <p className="github-status" role="status">
        Fill in your details manually. If you connect GitHub, empty name and bio
        fields are prefilled when available.
      </p>
      <section className="profile-avatar-editor" aria-label="Profile photo">
        <ProfileAvatar
          className="profile-avatar-preview"
          src={safeProfile.avatarImage || safeProfile.avatarUrl}
          initials={avatarInitials}
        />
        <div className="profile-avatar-controls">
          <div className="mock-field">
            <label htmlFor="profile-avatar">Profile photo</label>
            <input
              id="profile-avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
            />
            <span className="repository-description">
              JPG, PNG or WebP, up to 5 MB. Your photo overrides the connected
              account image and is saved when you publish.
            </span>
            {avatarError ? (
              <span className="repository-description" role="alert">
                {avatarError}
              </span>
            ) : null}
          </div>
          {safeProfile.avatarImage ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={onRemoveAvatar}
            >
              Remove uploaded photo
            </button>
          ) : null}
        </div>
      </section>
      <div className="mock-field">
        <label htmlFor="profile-name">Name</label>
        <input
          id="profile-name"
          name="name"
          value={safeProfile.name}
          onChange={onChange}
          placeholder="e.g. Your Name"
        />
      </div>
      <div className="mock-field">
        <label htmlFor="profile-role">Role</label>
        <textarea
          id="profile-role"
          name="role"
          value={safeProfile.role}
          onChange={onChange}
          placeholder="e.g. Frontend Developer and Product Designer"
          rows={2}
        />
      </div>
      <div className="mock-field">
        <label htmlFor="profile-shortBio">Short bio</label>
        <textarea
          id="profile-shortBio"
          name="shortBio"
          value={safeProfile.shortBio}
          onChange={onChange}
          placeholder="Write a short intro for your portfolio"
          rows={4}
        />
      </div>
      <div className="mock-field">
        <label htmlFor="profile-email">Contact email</label>
        <input
          id="profile-email"
          name="email"
          type="email"
          value={safeProfile.email}
          onChange={onChange}
          placeholder="e.g. hello@example.com"
        />
      </div>

      <section className="profile-list-editor">
        <h3>Skills</h3>
        <div className="mock-field">
          <label htmlFor="profile-skills">Technologies and skills</label>
          <textarea
            id="profile-skills"
            value={skillsText}
            onChange={onSkillsChange}
            placeholder="e.g. React, JavaScript, CSS, Figma"
            rows={2}
          />
          <span className="repository-description">
            Separate skills with commas.
          </span>
        </div>
      </section>

      <ProfileEntryEditor
        collection="experience"
        entries={safeProfile.experience}
        onChange={onEntryChange}
        onAdd={onAddEntry}
        onRemove={onRemoveEntry}
      />
      <ProfileEntryEditor
        collection="education"
        entries={safeProfile.education}
        onChange={onEntryChange}
        onAdd={onAddEntry}
        onRemove={onRemoveEntry}
      />

      <section className="profile-list-editor">
        <h3>Professional links</h3>
        {[
          { name: "github", label: "GitHub", placeholder: "https://github.com/username" },
          { name: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
          { name: "website", label: "Personal website", placeholder: "https://yourwebsite.com" },
        ].map((link) => (
          <div className="mock-field" key={link.name}>
            <label htmlFor={`profile-link-${link.name}`}>{link.label}</label>
            <input
              id={`profile-link-${link.name}`}
              name={link.name}
              type="url"
              value={
                safeProfile.links?.[link.name] ||
                (link.name === "github" && !githubLinkEdited
                  ? githubFallback
                  : "") ||
                ""
              }
              onChange={(event) => {
                if (link.name === "github") setGithubLinkEdited(true);
                onSocialLinkChange(event);
              }}
              placeholder={link.placeholder}
              maxLength={300}
            />
          </div>
        ))}
      </section>
    </article>
  );
}
