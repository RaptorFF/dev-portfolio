import { useState } from "react";
import { signIn, signOut } from "next-auth/react";

const emptyCustomProject = { name: "", description: "", url: "", language: "" };

function CustomProjectForm({ onAdd }) {
  const [draft, setDraft] = useState(emptyCustomProject);

  function update(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onAdd({
      name: draft.name.trim().slice(0, 100),
      description: draft.description.trim(),
      url: draft.url.trim(),
      language: draft.language.trim().slice(0, 50),
    });
    setDraft(emptyCustomProject);
  }

  return (
    <form onSubmit={submit}>
      <div className="project-section-heading">
        <h3>Add a project manually</h3>
      </div>
      <div className="mock-field">
        <label htmlFor="custom-project-name">Name</label>
        <input
          id="custom-project-name"
          name="name"
          value={draft.name}
          onChange={update}
          maxLength={100}
          required
        />
      </div>
      <div className="mock-field">
        <label htmlFor="custom-project-description">Description</label>
        <textarea
          id="custom-project-description"
          name="description"
          value={draft.description}
          onChange={update}
          rows={2}
          maxLength={500}
        />
      </div>
      <div className="mock-field">
        <label htmlFor="custom-project-url">Link (optional)</label>
        <input
          id="custom-project-url"
          name="url"
          type="url"
          value={draft.url}
          onChange={update}
          placeholder="https://"
        />
      </div>
      <div className="mock-field">
        <label htmlFor="custom-project-language">Technology (optional)</label>
        <input
          id="custom-project-language"
          name="language"
          value={draft.language}
          onChange={update}
          maxLength={50}
        />
      </div>
      <button className="button button-secondary" type="submit">
        Add project
      </button>
    </form>
  );
}

export default function ProjectsManager({
  githubState,
  githubData,
  githubUser,
  repositories,
  showRepositoryManager,
  selectedProjects,
  onRefresh,
  onToggleProject,
  onMoveProject,
  onUpdateDescription,
  onAddCustomProject,
  onRemoveProject,
}) {
  return (
    <article className="editor-card" id="projects">
      <div className="card-headline">
        <h2>Projects</h2>
        {githubState === "connected" || githubData ? (
          <div className="github-actions">
            <button
              className="text-button"
              type="button"
              disabled={githubState === "loading"}
              onClick={onRefresh}
            >
              {githubState === "loading" ? "Refreshing..." : "Refresh"}
            </button>
            {githubState === "connected" ? (
              <button
                className="text-button"
                type="button"
                onClick={() => signOut({ callbackUrl: "/dashboard" })}
              >
                Disconnect
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="github-status" role="status">
        {githubState === "loading" &&
          (githubData
            ? "Showing saved public repositories while checking GitHub for updates..."
            : "Loading GitHub repositories...")}
        {githubState === "connected" &&
          `Connected as @${githubUser?.login}. Only public repositories are imported.`}
        {githubState === "disconnected" &&
          "Connect GitHub to import your public repositories."}
        {githubState === "not-configured" &&
          "GitHub OAuth is not configured. Add the credentials from .env.example to .env.local."}
        {githubState === "error" &&
          (githubData
            ? "Could not refresh GitHub repositories. Showing saved data; try refreshing again."
            : "Could not load repositories. Try refreshing the list.")}
      </p>

      {githubState === "disconnected" ? (
        <button
          className="button button-primary github-connect-button"
          type="button"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        >
          Connect GitHub
        </button>
      ) : null}

      {githubState === "not-configured" ? (
        <button
          className="button button-primary github-connect-button"
          type="button"
          disabled
        >
          Connect GitHub
        </button>
      ) : null}

      <div className="project-section-heading">
        <h3>Selected for portfolio</h3>
        <span>{selectedProjects.length} selected</span>
      </div>

      {selectedProjects.length ? (
        <div className="selected-project-list">
          {selectedProjects.map((project, index) => (
            <article className="selected-project" key={project.id}>
              <div className="project-row">
                <div className="project-summary">
                  <strong>{project.name}</strong>
                  <span>
                    {project.language || "Project"}
                    {typeof project.id === "number"
                      ? ` · ★ ${project.stars}`
                      : ""}
                  </span>
                </div>
                <div className="project-order-controls">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onMoveProject(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${project.name} up`}
                  >
                    Move up
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onMoveProject(index, 1)}
                    disabled={index === selectedProjects.length - 1}
                    aria-label={`Move ${project.name} down`}
                  >
                    Move down
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onRemoveProject(project.id)}
                    aria-label={`Remove ${project.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mock-field project-description-field">
                <label htmlFor={`project-description-${project.id}`}>
                  Portfolio description
                </label>
                <textarea
                  id={`project-description-${project.id}`}
                  value={project.portfolioDescription}
                  onChange={(event) =>
                    onUpdateDescription(project.id, event.target.value)
                  }
                  rows={2}
                  placeholder="Describe what this project does"
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="project-empty-state">
          Add a project manually below
          {showRepositoryManager ? " or pick repositories" : ""} to choose what
          appears in your portfolio.
        </p>
      )}

      <CustomProjectForm onAdd={onAddCustomProject} />

      {showRepositoryManager ? (
        <>

          <div className="project-section-heading">
            <h3>Your repositories</h3>
            <span>{repositories.length} public</span>
          </div>
          <div className="project-list">
            {repositories.map((repository) => {
              const isSelected = selectedProjects.some(
                (project) => project.id === repository.id,
              );

              return (
                <div className="project-row" key={repository.id}>
                  <div className="project-summary">
                    <strong>{repository.name}</strong>
                    <span>
                      {repository.language || "Repository"} · ★{" "}
                      {repository.stars}
                    </span>
                    {repository.description ? (
                      <span className="repository-description">
                        {repository.description}
                      </span>
                    ) : null}
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onToggleProject(repository)}
                  >
                    {isSelected ? "Remove" : "Add project"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </article>
  );
}
