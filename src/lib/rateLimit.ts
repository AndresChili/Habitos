import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// Respaldado en BD (no en memoria) porque las Vercel Functions no comparten
// estado entre instancias — un contador en memoria se reiniciaría en cada
// cold start/instancia y no frenaría de verdad un intento de fuerza bruta distribuido.
const WINDOW_MS = 15 * 60 * 1000;
// Límite por email: deliberadamente bajo, es un bloqueo intencionado de esa
// cuenta frente a fuerza bruta dirigida.
const MAX_FAILED_ATTEMPTS_PER_EMAIL = 10;
// Límite por IP: más alto porque varias personas reales pueden compartir IP
// (NAT, oficina, red móvil). Frena a quien prueba una misma contraseña contra
// muchos emails distintos, cosa que el límite por email no detecta.
const MAX_FAILED_ATTEMPTS_PER_IP = 30;
const CLEANUP_OLDER_THAN_MS = 24 * 60 * 60 * 1000;

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function isRateLimited(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [emailCount, ipCount] = await Promise.all([
    prisma.loginAttempt.count({
      where: { email, success: false, createdAt: { gte: since } },
    }),
    prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: since } },
    }),
  ]);
  return emailCount >= MAX_FAILED_ATTEMPTS_PER_EMAIL || ipCount >= MAX_FAILED_ATTEMPTS_PER_IP;
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean): Promise<void> {
  await prisma.loginAttempt.create({ data: { email, ip, success } });

  // Limpieza oportunista para que la tabla no crezca sin límite — sin necesidad de cron.
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - CLEANUP_OLDER_THAN_MS);
    await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
  }
}
