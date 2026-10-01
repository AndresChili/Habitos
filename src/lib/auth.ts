import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const BCRYPT_ROUNDS = 12;

// Precomputed bcrypt hash of a random, unused string — compared against on a
// failed lookup so login takes the same time whether or not the email
// exists, instead of returning early and leaking that distinction via timing.
const DUMMY_HASH = "$2b$12$IIJ.qwoMLS8/rP3FRVqSUOLIq6Ph0B9Y/RutXaRv2.sskwuHuciKG";

export type SessionPayload = { uid: string; exp: number };

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof parsed?.uid === "string" && typeof parsed?.exp === "number") {
      return { uid: parsed.uid, exp: parsed.exp };
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Always runs a bcrypt comparison, even when no user matches — keeps login
// timing constant regardless of whether the email is registered.
export async function verifyPasswordOrDummy(
  password: string,
  hash: string | undefined
): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [encodedPayload, sig] = token.split(".");
  if (!encodedPayload || !sig) return null;

  let expected: string;
  try {
    expected = sign(encodedPayload);
  } catch {
    return null;
  }
  if (expected.length !== sig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;

  const payload = decodePayload(encodedPayload);
  if (!payload) return null;
  if (payload.exp <= Date.now()) return null;
  return payload;
}

export async function createSession(userId: string) {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const encodedPayload = encodePayload({ uid: userId, exp });
  const token = `${encodedPayload}.${sign(encodedPayload)}`;
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
