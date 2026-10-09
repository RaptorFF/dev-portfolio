import { Octokit } from "@octokit/rest";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { getSupabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_PROJECTS = 50;
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

const str = (value, max) =>
  typeof value === "string" ? value.slice(0, max) : "";

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

  try {
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
      theme: str(body?.theme, 30) || "purple",
      profile: {
        name: str(body?.profile?.name, 100),
        role: str(body?.profile?.role, 200),
        shortBio: str(body?.profile?.shortBio, 1000),
        email: str(body?.profile?.email, 200).trim(),
      },
      selected_projects: projects,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("portfolios")
      .upsert(row, { onConflict: "user_id" });

    if (error?.code === "23505") {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    if (error) throw error;

    return NextResponse.json({ slug: row.slug });
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
