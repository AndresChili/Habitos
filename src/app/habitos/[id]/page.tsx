import Link from "next/link";
import { notFound } from "next/navigation";
import { getHabitDetail, getSettingsTz } from "@/lib/habits";
import HabitHeatmap from "@/components/HabitHeatmap";
import StatTile from "@/components/StatTile";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function pct(n: number | null): string {
  return n === null ? "—" : `${Math.round(n * 100)}%`;
}

function deltaLabel(current: number | null, previous: number | null): string | undefined {
  if (current === null || previous === null) return undefined;
  const diff = Math.round((current - previous) * 100);
  if (diff === 0) return "igual que el periodo anterior";
  return `${diff > 0 ? "+" : ""}${diff} pts vs. periodo anterior`;
}

export default async function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tz = await getSettingsTz();
  const detail = await getHabitDetail(id, tz);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/habitos"
          className="inline-flex items-center gap-1 text-xs font-medium text-text-faint transition-colors hover:text-text-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Hábitos
        </Link>
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-text">{detail.name}</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            {detail.kind === "FIXED_DAYS"
              ? detail.weekdays.length === 7
                ? "Diario"
                : detail.weekdays.map((d) => WEEKDAY_LABELS[d - 1]).join(" · ")
              : `Una vez por ${detail.quotaPeriod === "WEEK" ? "semana" : "mes"}`}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Racha actual" value={detail.currentStreak.toString()} hint={detail.kind === "FIXED_DAYS" ? "días" : "periodos"} />
        <StatTile
          label="Cumplimiento"
          value={pct(detail.completionRate)}
          hint={
            detail.kind === "FIXED_DAYS"
              ? deltaLabel(detail.completionRate, detail.previousCompletionRate) ?? "últimas 6 semanas"
              : detail.previousMet !== null
                ? `periodo anterior: ${detail.previousMet ? "cumplido" : "no cumplido"}`
                : undefined
          }
        />
      </div>

      {detail.kind === "FIXED_DAYS" ? (
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Historial</h2>
          <HabitHeatmap cells={detail.cells} />
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-text-faint">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[4px] bg-gradient-to-br from-accent to-accent-2" /> cumplido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[4px] border border-warn/50 bg-warn-soft" /> fallado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[4px] border-2 border-accent" /> hoy, pendiente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[4px] bg-surface-muted" /> no programado
            </span>
          </div>
        </section>
      ) : (
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Últimos periodos</h2>
          <div className="space-y-1.5">
            {detail.periods.map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm shadow-card"
              >
                <span className="w-16 shrink-0 text-xs capitalize text-text-faint">{p.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full transition-all ${p.met ? "bg-gradient-to-br from-accent to-accent-2" : "bg-warn-soft"}`}
                    style={{ width: `${Math.min(100, (p.done / p.target) * 100)}%` }}
                  />
                </div>
                {p.current ? (
                  <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-strong">actual</span>
                ) : (
                  <span className="w-16 shrink-0 text-right text-xs font-medium text-text-muted">
                    {p.met ? "cumplido" : "no cumplido"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
