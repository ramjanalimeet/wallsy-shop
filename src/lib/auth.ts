import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "wallsy_admin";
const MAX_AGE = 60 * 60 * 24 * 7;
// Values from .env.example that must be replaced before going live.
const PLACEHOLDER_SECRET = "replace-with-a-long-random-string";
const PLACEHOLDER_PASSWORD = "change-me";

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16 || (process.env.NODE_ENV === "production" && s === PLACEHOLDER_SECRET))
    throw new Error("ADMIN_SECRET must be set to your own random string of at least 16 characters");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || (process.env.NODE_ENV === "production" && expected === PLACEHOLDER_PASSWORD)) return false;
  // Compare HMACs so the comparison is constant-time regardless of length.
  return safeEqual(sign(password), sign(expected));
}

export async function createSession() {
  const expires = Date.now() + MAX_AGE * 1000;
  const token = `${expires}.${sign(String(expires))}`;
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
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, sign(expires));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
