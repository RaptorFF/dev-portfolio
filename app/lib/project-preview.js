// Utility functions for handling project preview URLs and images.

const isHttp = (url) => typeof url === "string" && /^https?:\/\//i.test(url);

function parseGithubRepo(url) {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== "github.com" && hostname !== "www.github.com") return null;
    const [owner, repo] = pathname.split("/").filter(Boolean);
    return owner && repo ? { owner, repo } : null;
  } catch {
    return null;
  }
}

const isGithubUrl = (url) => {
  try {
    return /(^|\.)github\.com$/.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

export const getLiveUrl = (project) =>
  [project.homepage, project.htmlUrl].find(
    (url) => isHttp(url) && !isGithubUrl(url),
  );

// Ordered list of image URLs to try: custom image, stored screenshot, live screenshot, GitHub OG card.
export function getPreviewCandidates(project) {
  const candidates = [];

  if (isHttp(project.previewImage)) candidates.push(project.previewImage);
  if (isHttp(project.cachedPreview)) candidates.push(project.cachedPreview);

  const liveUrl = getLiveUrl(project);
  if (liveUrl) {
    candidates.push(
      `https://api.microlink.io/?url=${encodeURIComponent(liveUrl)}&screenshot=true&meta=false&embed=screenshot.url`,
    );
  }

  const repo = parseGithubRepo(project.htmlUrl);
  if (repo) {
    candidates.push(
      `https://opengraph.githubassets.com/1/${repo.owner}/${repo.repo}`,
    );
  }

  return candidates;
}

export function getProjectLink(project) {
  return (
    getLiveUrl(project) ||
    (isHttp(project.htmlUrl) ? project.htmlUrl : undefined)
  );
}
