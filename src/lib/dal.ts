import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Comprobación de autorización centralizada — toda función de acceso a datos
// en src/lib la llama para obtener el id del usuario actual. Memoizada por
// request para que varias llamadas no reverifiquen la cookie repetidamente
// durante un mismo render.
//
// Además de validar la firma, comprueba sessionVersion contra la BD: un logout
// o cambio de contraseña la incrementa, así que un token robado deja de servir
// de inmediato en vez de seguir siendo válido hasta su expiración (30 días).
export const requireUserId = cache(async (): Promise<string> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { sessionVersion: true },
  });
  // No se borra la cookie aquí: requireUserId también se llama desde
  // Server Components en render, donde Next.js no permite escribir cookies.
  // Da igual — con sessionVersion desajustada, esta misma comprobación
  // seguirá redirigiendo a /login en cada petición hasta que se renueve.
  if (!user || user.sessionVersion !== session.sv) {
    redirect("/login");
  }

  return session.uid;
});
