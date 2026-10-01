import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { SESSION_COOKIE } from "@/lib/auth";

function isValidToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const [encodedPayload, sig] = token.split(".");
  if (!encodedPayload || !sig) return false;
  const expected = crypto.createHmac("sha256", secret).update(encodedPayload).digest("hex");
  if (expected.length !== sig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    return typeof payload?.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;

  if (secret && isValidToken(token, secret)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!login|register|manifest.webmanifest|icon-192.png|icon-512.png|apple-icon.png|favicon.ico|_next/static|_next/image).*)",
  ],
};
