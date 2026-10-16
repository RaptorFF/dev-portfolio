const safeUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) return undefined;
  const normalized = /^https?:\/\//i.test(url.trim())
    ? url.trim()
    : `https://${url.trim()}`;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? normalized
      : undefined;
  } catch {
    return undefined;
  }
};

export default function PortfolioDetails({ profile, githubFallback }) {
  const skills = (Array.isArray(profile.skills)
    ? profile.skills
    : typeof profile.skills === "string"
      ? profile.skills.split(",")
      : []
  ).filter((skill) => typeof skill === "string" && skill.trim());
  const experience = Array.isArray(profile.experience)
    ? profile.experience.filter(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          [entry.role, entry.company, entry.period, entry.description].some(
            (value) => typeof value === "string" && value.trim(),
          ),
      )
    : [];
  const education = Array.isArray(profile.education)
    ? profile.education.filter(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          [entry.degree, entry.school, entry.period, entry.description].some(
            (value) => typeof value === "string" && value.trim(),
          ),
      )
    : [];
  const links = profile.links ?? {};
  const socialLinks = [
    { label: "GitHub", url: links.github || githubFallback },
    { label: "LinkedIn", url: links.linkedin },
    { label: "Website", url: links.website },
  ]
    .map((link) => ({ ...link, url: safeUrl(link.url) }))
    .filter((link) => link.url);

  return (
    <>
      {education.length ? (
        <section className="preview-page-section">
          <h3>Education</h3>
          <div className="portfolio-entry-list">
            {education.map((entry, index) => (
              <article key={`${entry.school}-${entry.degree}-${index}`}>
                <h4>{entry.degree}</h4>
                <p className="portfolio-entry-meta">
                  {[entry.school, entry.period].filter(Boolean).join(" · ")}
                </p>
                {entry.description ? <p>{entry.description}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {experience.length ? (
        <section className="preview-page-section">
          <h3>Experience</h3>
          <div className="portfolio-entry-list">
            {experience.map((entry, index) => (
              <article key={`${entry.company}-${entry.role}-${index}`}>
                <h4>{entry.role}</h4>
                <p className="portfolio-entry-meta">
                  {[entry.company, entry.period].filter(Boolean).join(" · ")}
                </p>
                {entry.description ? <p>{entry.description}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {skills.length ? (
        <section className="preview-page-section">
          <h3>Skills</h3>
          <ul className="portfolio-skill-list">
            {skills.map((skill, index) => (
              <li key={`${skill}-${index}`}>{skill}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {socialLinks.length ? (
        <section className="preview-page-section">
          <h3>Find me online</h3>
          <div className="portfolio-social-links">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
