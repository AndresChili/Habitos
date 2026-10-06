import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Comprobación de autorización centralizada — toda función de acceso a datos
// en src/lib la llama para obtener el id del usuario actual. Memoizada por
// request para que varias llamadas no reverifiquen la cookie repetidamente
// durante un mismo render.
export const requireUserId = cache(async (): Promise<string> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) redirect("/login");
  return session.uid;
});
