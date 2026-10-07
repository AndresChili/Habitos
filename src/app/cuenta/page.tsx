import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal";
import { changePasswordAction, createBreakAction, logoutAction } from "@/app/actions";
import { listBreaks } from "@/lib/breaks";
import { getSettingsTz } from "@/lib/habits";
import { dayKey, nowInTz } from "@/lib/dates";
import { BREAK_REASON_LABELS, formatBreakRange } from "@/lib/breakLabels";
import { IconChartBar, IconChevronRight, IconLogout } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";
import BreakDeleteButton from "@/components/BreakDeleteButton";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  current: "Contraseña actual incorrecta.",
  weak: "La nueva contraseña debe tener al menos 8 caracteres.",
  match: "Las contraseñas nuevas no coinciden.",
};

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; breakError?: string }>;
}) {
  const userId = await requireUserId();
  const [user, breaks, tz] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } }),
    listBreaks(),
    getSettingsTz(),
  ]);
  const todayKey = dayKey(nowInTz(tz));
  const params = await searchParams;
  const errorMessage = params.error ? ERRORS[params.error] : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-[26px] font-bold tracking-tight text-text">Cuenta</h1>
        <p className="text-sm text-text-muted">{user.email}</p>
      </header>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Hábitos</h2>
        <Link
          href="/cuenta/estadisticas"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-card transition-all active:scale-[0.98] hover:border-text-faint/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-accent-on shadow-glow">
            <IconChartBar className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium text-text">Estadísticas</span>
          <IconChevronRight className="h-4 w-4 shrink-0 text-text-faint" />
        </Link>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Vacaciones y pausas</h2>
        <p className="text-xs text-text-faint">
          Marca los días que no vas a poder hacer hábitos ni gimnasio — esos días no cuentan como fallados ni rompen tu racha.
        </p>

        {breaks.length > 0 && (
          <div className="space-y-2">
            {breaks.map((b) => {
              const active = b.fromDate <= todayKey && (b.toDate === null || b.toDate >= todayKey);
              return (
                <div key={b.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-card">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-text">
                      {BREAK_REASON_LABELS[b.reason]}
                      {active && (
                        <span className="rounded-full bg-violet-soft px-1.5 py-0.5 text-[10px] font-semibold text-violet-strong">
                          En curso
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-faint">
                      {formatBreakRange(b.fromDate, b.toDate)}
                      {b.note ? ` · ${b.note}` : ""}
                    </p>
                  </div>
                  <BreakDeleteButton id={b.id} />
                </div>
              );
            })}
          </div>
        )}

        <form action={createBreakAction} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <select
            name="reason"
            defaultValue="VACATION"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-accent"
          >
            {Object.entries(BREAK_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              name="fromDate"
              required
              defaultValue={todayKey}
              className="w-1/2 rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text outline-none focus:border-accent"
            />
            <input
              type="date"
              name="toDate"
              className="w-1/2 rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text outline-none focus:border-accent"
            />
          </div>
          <p className="text-xs text-text-faint">Déjalo sin &quot;hasta&quot; si todavía no sabes cuándo vuelves.</p>
          <input
            type="text"
            name="note"
            placeholder="Nota (opcional)"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-accent"
          />

          {params.breakError && <p className="text-sm text-danger">{params.breakError}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-br from-accent to-accent-2 py-3 text-sm font-semibold text-accent-on shadow-glow transition-all active:scale-[0.98] hover:brightness-110"
          >
            Añadir pausa
          </button>
        </form>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Apariencia</h2>
        <ThemeToggle />
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Cambiar contraseña</h2>
        <form
          action={changePasswordAction}
          className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card"
        >
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
            placeholder="Contraseña actual"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
          />
          <input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
          />
          <input
            type="password"
            name="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Repite la nueva contraseña"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-accent"
          />

          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
          {params.ok && <p className="text-sm text-accent-strong">Contraseña actualizada.</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-br from-accent to-accent-2 py-3 text-sm font-semibold text-accent-on shadow-glow transition-all active:scale-[0.98] hover:brightness-110"
          >
            Actualizar contraseña
          </button>
        </form>
      </section>

      <section>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-semibold text-text-muted shadow-card transition-all active:scale-[0.98] hover:text-text"
          >
            <IconLogout className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}
