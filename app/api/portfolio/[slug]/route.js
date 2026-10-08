import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { slug } = await params;

  const { data, error } = await supabase
    .from("portfolios")
    .select("slug, theme, profile, selected_projects, updated_at")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Public portfolio load failed:", error);
    return NextResponse.json({ error: "load_failed" }, { status: 502 });
  }

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ portfolio: data });
}
