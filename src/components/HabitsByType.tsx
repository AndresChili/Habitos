"use client";

import { useState } from "react";
import HabitActions from "@/components/HabitActions";
import QuotaToggle from "@/components/QuotaToggle";
import { IconClock, IconFlame } from "@/components/icons";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

type FixedHabit = { id: string; name: string; weekdays: number[]; paused: boolean };
type QuotaHabitRow = { id: string; name: string; done: number; periodLabel: string; paused: boolean };
type Archived = { id: string; name: string };

export default function HabitsByType({
  fixed,
  quota,
  archivedFixed,
  archivedQuota,
}: {
  fixed: FixedHabit[];
  quota: QuotaHabitRow[];
  archivedFixed: Archived[];
  archivedQuota: Archived[];
}) {
  const [tab, setTab] = useState<"diarios" | "semanal">("diarios");
  const archived = tab === "diarios" ? archivedFixed : archivedQuota;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => setTab("diarios")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "diarios" ? "bg-surface text-text shadow-card" : "text-text-muted"
          }`}
        >
          <IconFlame className="h-3.5 w-3.5 text-warn" />
          Diarios
        </button>
        <button
          type="button"
          onClick={() => setTab("semanal")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "semanal" ? "bg-surface text-text shadow-card" : "text-text-muted"
          }`}
        >
          <IconClock className="h-3.5 w-3.5 text-blue" />
          Semanal · Mensual
        </button>
      </div>

      {tab === "diarios" ? (
        fixed.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-faint">
            Ningún hábito diario todavía.
          </p>
        ) : (
          <div className="space-y-2.5">
            {fixed.map((h) => (
              <div
                key={h.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-accent-on shadow-glow">
                    <IconFlame className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text">{h.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-text-faint">
                      {h.weekdays.length === 7 ? "Diario" : h.weekdays.map((d) => WEEKDAY_LABELS[d - 1]).join(" ")}
                      {h.paused && " · pausado"}
                    </p>
                  </div>
                </div>
                <div className="border-t border-border">
                  <HabitActions id={h.id} archived={false} paused={h.paused} />
                </div>
              </div>
            ))}
          </div>
        )
      ) : quota.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-faint">
          Ningún hábito semanal/mensual todavía.
        </p>
      ) : (
        <div className="space-y-2.5">
          {quota.map((h) => (
            <div key={h.id} className="space-y-2">
              <QuotaToggle habitId={h.id} name={h.name} done={h.done > 0} periodLabel={h.periodLabel} paused={h.paused} />
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
                <HabitActions id={h.id} archived={false} paused={h.paused} />
              </div>
            </div>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Archivados</h2>
          <div className="space-y-2.5">
            {archived.map((h) => (
              <div key={h.id} className="overflow-hidden rounded-2xl border border-dashed border-border bg-surface">
                <p className="truncate px-4 py-3 text-sm text-text-faint">{h.name}</p>
                <div className="border-t border-dashed border-border">
                  <HabitActions id={h.id} archived paused={false} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
