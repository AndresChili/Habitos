import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Centralized authorization check — every data-access function in src/lib
// calls this to get the current user's id. Memoized per request so multiple
// calls don't re-verify the cookie repeatedly during one render pass.
export const requireUserId = cache(async (): Promise<string> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) redirect("/login");
  return session.uid;
});
