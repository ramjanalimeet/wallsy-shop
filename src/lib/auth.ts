import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "wallsy_admin";
const MAX_AGE = 60 * 60 * 24 * 7;
// The example password from .env.example is refused in production.
const PLACEHOLDER_PASSWORD = "change-me";

function adminPassword() {
  const p = process.env.ADMIN_PASSWORD;
  if (!p || (process.env.NODE_ENV === "production" && p === PLACEHOLDER_PASSWORD)) return null;
  return p;
}

export function adminConfigured() {
  return adminPassword() !== null;
}

/**
 * Key for signing the session cookie. ADMIN_SECRET is optional: without it the key is
 * derived from the password, so changing the password also signs everyone out.
 */
function signingKey() {
  const password = adminPassword();
  if (!password) return null;
  return process.env.ADMIN_SECRET || createHash("sha256").update(`wallsy-session:${password}`).digest("hex");
}

function sign(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Optional sign-in email. When ADMIN_EMAIL isn't set, only the password is checked. */
export function adminEmailRequired() {
  return Boolean(process.env.ADMIN_EMAIL?.trim());
}

export function checkCredentials(email: string, password: string) {
  const expected = adminPassword();
  const key = signingKey();
  if (!expected || !key) return false;
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  // Compare HMACs so the comparison is constant-time regardless of length.
  const emailOk = !expectedEmail || safeEqual(sign(email.trim().toLowerCase(), key), sign(expectedEmail, key));
  const passwordOk = safeEqual(sign(password, key), sign(expected, key));
  return emailOk && passwordOk;
}

export async function createSession() {
  const key = signingKey();
  if (!key) throw new Error("ADMIN_PASSWORD is not set");
  const expires = Date.now() + MAX_AGE * 1000;
  const token = `${expires}.${sign(String(expires), key)}`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  const key = signingKey();
  if (!token || !key) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, sign(expires, key));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
