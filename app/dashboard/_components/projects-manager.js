import { signIn, signOut } from "next-auth/react";

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

      {showRepositoryManager ? (
        <>
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
                        {project.language || "Repository"} · ★ {project.stars}
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
              Add repositories below to choose what appears in your portfolio.
            </p>
          )}

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
