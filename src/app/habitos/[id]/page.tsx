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
      <header className="space-y-1">
        <Link href="/habitos" className="text-xs text-text-faint hover:text-text-muted">
          ← Hábitos
        </Link>
        <h1 className="text-2xl font-semibold text-text">{detail.name}</h1>
        <p className="text-sm text-text-muted">
          {detail.kind === "FIXED_DAYS"
            ? detail.weekdays.map((d) => WEEKDAY_LABELS[d - 1]).join(" · ")
            : `${detail.quotaTarget} veces por ${detail.quotaPeriod === "WEEK" ? "semana" : "mes"}`}
        </p>
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
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-text-muted">Historial</h2>
          <HabitHeatmap cells={detail.cells} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-faint">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-accent" /> cumplido
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm border border-warn/50 bg-warn-soft" /> fallado
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm border border-accent" /> hoy, pendiente
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-surface-muted" /> no programado
            </span>
          </div>
        </section>
      ) : (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-text-muted">Últimos periodos</h2>
          <div className="space-y-1.5">
            {detail.periods.map((p) => (
              <div key={p.label} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <span className="w-16 shrink-0 text-xs capitalize text-text-faint">{p.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${p.met ? "bg-accent" : "bg-warn-soft"}`}
                    style={{ width: `${Math.min(100, (p.done / p.target) * 100)}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs text-text-muted">
                  {p.done}/{p.target}
                </span>
                {p.current && <span className="shrink-0 text-xs text-accent">actual</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
