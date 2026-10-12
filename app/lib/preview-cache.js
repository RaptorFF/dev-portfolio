import { getLiveUrl } from "./project-preview";

const BUCKET = "project-previews";
const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20000;
const MAX_NEW_PER_PUBLISH = 6;

async function ensureBucket(supabase) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });
  if (error && !/already exists|duplicate/i.test(error.message ?? "")) {
    throw error;
  }
}

async function captureScreenshot(liveUrl) {
  const response = await fetch(
    `https://api.microlink.io/?url=${encodeURIComponent(liveUrl)}&screenshot=true&meta=false&embed=screenshot.url`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
  );
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !/^image\/(png|jpeg|webp)/.test(type)) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_BYTES) return null;

  return { buffer, contentType: type.split(";")[0] };
}

async function cacheOne(supabase, userId, project, liveUrl) {
  const shot = await captureScreenshot(liveUrl);
  if (!shot) return null;

  const owner = userId.replace(/[^\w-]/g, "_");
  const path = `${owner}/${String(project.id).replace(/[^\w-]/g, "_")}.png`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, shot.buffer, {
      contentType: shot.contentType,
      upsert: true,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

const empty = { cachedPreview: "", cachedPreviewSource: "" };

// Keeps an existing cached screenshot while the live URL is unchanged,
// and generates one (once) for new or changed projects.
export async function attachCachedPreviews(
  supabase,
  userId,
  projects,
  existingProjects,
) {
  const existing = new Map(
    (Array.isArray(existingProjects) ? existingProjects : []).map((p) => [
      p.id,
      p,
    ]),
  );

  let bucketReady = false;
  let budget = MAX_NEW_PER_PUBLISH;

  return Promise.all(
    projects.map(async (project) => {
      const liveUrl = getLiveUrl(project);
      if (!liveUrl || project.previewImage) return { ...project, ...empty };

      const previous = existing.get(project.id);
      if (previous?.cachedPreview && previous.cachedPreviewSource === liveUrl) {
        return {
          ...project,
          cachedPreview: previous.cachedPreview,
          cachedPreviewSource: liveUrl,
        };
      }

      if (budget <= 0) return { ...project, ...empty };
      budget -= 1;

      try {
        if (!bucketReady) {
          await ensureBucket(supabase);
          bucketReady = true;
        }
        const cachedPreview = await cacheOne(
          supabase,
          userId,
          project,
          liveUrl,
        );
        return cachedPreview
          ? {
              ...project,
              cachedPreview,
              cachedPreviewSource: liveUrl,
            }
          : { ...project, ...empty };
      } catch (error) {
        console.error("Preview caching failed:", error);
        return { ...project, ...empty };
      }
    }),
  );
}
