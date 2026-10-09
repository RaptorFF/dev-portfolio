import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { getSupabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

export async function GET(request) {
  const supabase = getSupabase();
  if (!supabase || !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const slug = (new URL(request.url).searchParams.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const userId = token?.sub
    ? token.githubAccessToken
      ? `github:${token.sub}`
      : token.sub
    : null;

  const { data, error } = await supabase
    .from("portfolios")
    .select("user_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Slug check failed:", error);
    return NextResponse.json({ error: "check_failed" }, { status: 502 });
  }

  return NextResponse.json({ available: !data || data.user_id === userId });
}
