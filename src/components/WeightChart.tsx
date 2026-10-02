"use client";

import { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { es } from "date-fns/locale";

type Point = { date: string; weightKg: number };

const RANGES = [
  { key: "1M", label: "1 mes", days: 30 },
  { key: "3M", label: "3 meses", days: 90 },
  { key: "6M", label: "6 meses", days: 180 },
  { key: "ALL", label: "Todo", days: null },
] as const;

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 8;
const PAD_Y = 16;

export default function WeightChart({ data }: { data: Point[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("3M");

  const filtered = useMemo(() => {
    const active = RANGES.find((r) => r.key === range)!;
    if (active.days === null) return data;
    const cutoff = format(subDays(new Date(), active.days), "yyyy-MM-dd");
    return data.filter((d) => d.date >= cutoff);
  }, [data, range]);

  if (filtered.length === 0) {
    return <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-faint">Sin datos en este periodo.</p>;
  }

  const weights = filtered.map((d) => d.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;

  const first = new Date(filtered[0].date).getTime();
  const last = new Date(filtered[filtered.length - 1].date).getTime();
  const timeSpan = last - first || 1;

  const points = filtered.map((d) => {
    const x = PAD_X + ((new Date(d.date).getTime() - first) / timeSpan) * (WIDTH - PAD_X * 2);
    const y = HEIGHT - PAD_Y - ((d.weightKg - min) / span) * (HEIGHT - PAD_Y * 2);
    return { x, y, ...d };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const current = filtered[filtered.length - 1].weightKg;
  const delta = filtered.length > 1 ? current - filtered[0].weightKg : 0;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold text-text">{current.toFixed(1)} kg</p>
          {filtered.length > 1 && (
            <p className="text-xs text-text-muted">
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)} kg en el periodo
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all active:scale-95 ${
                range === r.key ? "bg-accent-soft text-accent-strong" : "text-text-faint hover:text-text-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-36 w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.length < 40 &&
          points.map((p) => <circle key={p.date} cx={p.x} cy={p.y} r={2.2} fill="var(--accent)" />)}
      </svg>

      <div className="flex justify-between text-xs text-text-faint">
        <span>{format(parseISO(filtered[0].date), "d MMM", { locale: es })}</span>
        <span>
          mín {min.toFixed(1)} · máx {max.toFixed(1)}
        </span>
        <span>{format(parseISO(filtered[filtered.length - 1].date), "d MMM", { locale: es })}</span>
      </div>
    </div>
  );
}
