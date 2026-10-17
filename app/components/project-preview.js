"use client";

import { useState } from "react";
import { getPreviewCandidates } from "../lib/project-preview";

export default function ProjectPreview({ project }) {
  const candidates = getPreviewCandidates(project);
  const key = candidates.join("|");
  const [failed, setFailed] = useState({ key, count: 0 });
  const index = failed.key === key ? failed.count : 0;
  const src = candidates[index];

  // If all preview candidates have failed, display a placeholder with the project's initial
  return (
    <div className="project-preview">
      {src ? (
        <img
          key={src}
          src={src}
          alt={`${project.name} preview`}
          loading="lazy"
          onError={() => setFailed({ key, count: index + 1 })}
        />
      ) : (
        <span className="project-preview-placeholder" aria-hidden="true">
          {(project.name || "?").charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
