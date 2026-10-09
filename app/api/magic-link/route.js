import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  EMAIL_PATTERN,
  RESEND_COOLDOWN_MS,
  TOKEN_TTL_MS,
  hashToken,
  normalizeEmail,
} from "../../lib/magic-link";
import { getSupabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function sendEmail(email, link) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    console.log(`\nMagic link for ${email}:\n${link}\n`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Portfolio Forge <onboarding@resend.dev>",
      to: email,
      subject: "Your Portfolio Forge sign-in link",
      text: `Use this link to sign in (valid for 15 minutes, one use):\n\n${link}\n\nIf you did not request it, ignore this email.`,
    }),
  });

  if (!response.ok) throw new Error(`Email provider error ${response.status}`);
}

export async function POST(request) {
  const supabase = getSupabase();
  if (!supabase || !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = normalizeEmail(body?.email);
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    const { data: recent } = await supabase
      .from("login_tokens")
      .select("created_at")
      .eq("email", email)
      .gt("created_at", new Date(Date.now() - RESEND_COOLDOWN_MS).toISOString())
      .limit(1);

    if (recent?.length) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }

    await supabase
      .from("login_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());

    const token = randomBytes(32).toString("hex");
    const { error } = await supabase.from("login_tokens").insert({
      token_hash: hashToken(token),
      email,
      expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    });
    if (error) throw error;

    const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const link = `${origin}/login/verify?${new URLSearchParams({ email, token })}`;
    await sendEmail(email, link);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Magic link request failed:", error);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
}
