import { Octokit } from "@octokit/rest";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { attachCachedPreviews } from "../../lib/preview-cache";
import { getSupabase } from "../../lib/supabase";
import { DEFAULT_THEME } from "../../lib/themes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_PROJECTS = 50;
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
const AVATAR_IMAGE_PATTERN =
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const MAX_AVATAR_IMAGE_LENGTH = 2_000_000;

const str = (value, max) =>
  typeof value === "string" ? value.slice(0, max) : "";
const safeExternalUrl = (value, max) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const normalized = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? str(normalized, max)
      : "";
  } catch {
    return "";
  }
};

function sanitizeAvatarImage(value) {
  if (
    typeof value !== "string" ||
    value.length > MAX_AVATAR_IMAGE_LENGTH ||
    !AVATAR_IMAGE_PATTERN.test(value)
  ) {
    return "";
  }

  return value;
}

function sanitizeProfileEntry(entry, titleField, organizationField) {
  return {
    [titleField]: str(entry?.[titleField], 120),
    [organizationField]: str(entry?.[organizationField], 120),
    period: str(entry?.period, 80),
    description: str(entry?.description, 500),
  };
}

function sanitizeProject(project) {
  const validId =
    Number.isInteger(project?.id) ||
    (typeof project?.id === "string" && /^[\w-]{1,64}$/.test(project.id));
  if (!validId) return null;

  return {
    id: project.id,
    name: str(project.name, 100),
    portfolioDescription: str(project.portfolioDescription, 500),
    htmlUrl: str(project.htmlUrl, 300),
    homepage: str(project.homepage, 300),
    previewImage: /^https?:\/\//i.test(project.previewImage)
      ? str(project.previewImage, 500)
      : "",
    refreshPreview: project.refreshPreview === true,
    language: str(project.language, 50),
    stars: Number.isInteger(project.stars) ? project.stars : 0,
  };
}

async function getUser(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.sub) return null;

  const id = token.githubAccessToken ? `github:${token.sub}` : token.sub;
  return { id, token };
}

export async function GET(request) {
  const supabase = getSupabase();
  if (!supabase || !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("portfolios")
    .select("slug, theme, profile, selected_projects, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Portfolio load failed:", error);
    return NextResponse.json({ error: "load_failed" }, { status: 502 });
  }

  return NextResponse.json({ portfolio: data });
}

export async function PUT(request) {
  const supabase = getSupabase();
  if (!supabase || !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const projects = Array.isArray(body?.selectedProjects)
    ? body.selectedProjects
        .slice(0, MAX_PROJECTS)
        .map(sanitizeProject)
        .filter(Boolean)
    : [];
  const avatarImage = sanitizeAvatarImage(body?.profile?.avatarImage);
  if (body?.profile?.avatarImage && !avatarImage) {
    return NextResponse.json({ error: "invalid_avatar_image" }, { status: 400 });
  }

  try {
    const { data: existingRow } = await supabase
      .from("portfolios")
      .select("selected_projects")
      .eq("user_id", user.id)
      .maybeSingle();

    const projectsWithPreviews = await attachCachedPreviews(
      supabase,
      user.id,
      projects,
      existingRow?.selected_projects,
    );

    let slug;
    if (user.token.githubAccessToken) {
      // Slug se uzima sa GitHub-a, a ne iz zahteva, da ga korisnik ne bi lažirao.
      const octokit = new Octokit({ auth: user.token.githubAccessToken });
      const { data: ghUser } = await octokit.rest.users.getAuthenticated();
      slug = ghUser.login.toLowerCase();
    } else {
      slug = str(body?.slug, 30).trim().toLowerCase();
      if (!SLUG_PATTERN.test(slug)) {
        return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
      }
    }

    const row = {
      user_id: user.id,
      slug,
      theme: str(body?.theme, 30) || DEFAULT_THEME,
      profile: {
        name: str(body?.profile?.name, 100),
        role: str(body?.profile?.role, 200),
        shortBio: str(body?.profile?.shortBio, 1000),
        email: str(body?.profile?.email, 200).trim(),
        avatarUrl: safeExternalUrl(body?.profile?.avatarUrl, 1000),
        avatarImage,
        skills: Array.isArray(body?.profile?.skills)
          ? body.profile.skills
              .filter((skill) => typeof skill === "string")
              .slice(0, 30)
              .map((skill) => str(skill, 50).trim())
              .filter(Boolean)
          : [],
        experience: Array.isArray(body?.profile?.experience)
          ? body.profile.experience
              .slice(0, 20)
              .map((entry) =>
                sanitizeProfileEntry(entry, "role", "company"),
              )
          : [],
        education: Array.isArray(body?.profile?.education)
          ? body.profile.education
              .slice(0, 20)
              .map((entry) =>
                sanitizeProfileEntry(entry, "degree", "school"),
              )
          : [],
        links: {
          github: safeExternalUrl(body?.profile?.links?.github, 300),
          linkedin: safeExternalUrl(body?.profile?.links?.linkedin, 300),
          website: safeExternalUrl(body?.profile?.links?.website, 300),
        },
      },
      selected_projects: projectsWithPreviews,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("portfolios")
      .upsert(row, { onConflict: "user_id" });

    if (error?.code === "23505") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    if (error) throw error;

    return NextResponse.json({
      slug: row.slug,
      previews: projectsWithPreviews.map(
        ({ id, cachedPreview, cachedPreviewSource }) => ({
          id,
          cachedPreview,
          cachedPreviewSource,
        }),
      ),
    });
  } catch (error) {
    if (error.status === 401) {
      return NextResponse.json(
        { error: "github_authorization_expired" },
        { status: 401 },
      );
    }

    console.error("Portfolio save failed:", error);
    return NextResponse.json({ error: "save_failed" }, { status: 502 });
  }
}
