import { createHash } from "node:crypto";
import { getSupabase } from "./supabase";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TOKEN_TTL_MS = 15 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;

export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");

export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase().slice(0, 200) : "";

// Token se troši atomarno (delete ... returning), pa ga je moguće iskoristiti samo jednom.
export async function consumeLoginToken(email, token) {
  const supabase = getSupabase();
  if (!supabase || !email || typeof token !== "string") return false;

  const { data, error } = await supabase
    .from("login_tokens")
    .delete()
    .eq("token_hash", hashToken(token))
    .eq("email", email)
    .gt("expires_at", new Date().toISOString())
    .select("email");

  if (error) {
    console.error("Login token check failed:", error);
    return false;
  }

  return data.length === 1;
}
