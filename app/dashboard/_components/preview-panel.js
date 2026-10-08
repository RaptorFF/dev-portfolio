export default function PreviewPanel({
  profile,
  themes,
  selectedTheme,
  publishedSlug,
  onSelectTheme,
}) {
  const previewName = profile.name || "Your Name";
  const previewTitle = profile.role || "Your role will appear here";
  const previewBio =
    profile.shortBio ||
    "Add a short bio in Profile setup to preview your public portfolio.";

  return (
    <aside className="preview-panel" id="publish">
      <p className="section-kicker">Live preview</p>
      <h2>How your public portfolio will look</h2>

      <div className="mini-portfolio">
        <p className="mini-eyebrow">{previewName}</p>
        <h3>{previewTitle}</h3>
        <p>{previewBio}</p>
        {publishedSlug ? (
          <a
            className="button button-secondary"
            href={`/u/${publishedSlug}`}
            target="_blank"
            rel="noreferrer"
          >
            Open public page
          </a>
        ) : (
          <button type="button" className="button button-secondary" disabled>
            Publish to get your public URL
          </button>
        )}
      </div>

      <section className="theme-controls" id="theme">
        <h3>Theme controls</h3>
        <div className="theme-swatches">
          {themes.map((theme) => (
            <button
              key={theme.value}
              type="button"
              className={`swatch ${theme.value === selectedTheme ? "active" : ""}`}
              style={{ background: theme.accentGradient }}
              onClick={() => onSelectTheme(theme.value)}
              aria-label={`Select ${theme.label}`}
            />
          ))}
        </div>
        <p>
          Choose a color theme and see it reflected instantly in the live
          preview.
        </p>
      </section>

      <div className="sync-note">
        <strong>Project settings</strong>
        <p>
          Profile, projects and theme are saved to your account when you
          publish.
        </p>
      </div>
    </aside>
  );
}
