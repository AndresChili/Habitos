import { getQuotaHabits, getSettingsTz, isCurrentlyPaused, listHabits } from "@/lib/habits";
import HabitForm from "@/components/HabitForm";
import HabitActions from "@/components/HabitActions";
import QuotaToggle from "@/components/QuotaToggle";
import HabitosTabs from "@/components/HabitosTabs";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export default async function HabitosPage() {
  const tz = await getSettingsTz();
  const [allHabits, quotaHabits] = await Promise.all([listHabits(true), getQuotaHabits(tz)]);

  const active = allHabits.filter((h) => !h.archivedAt);
  const archived = allHabits.filter((h) => h.archivedAt);
  const fixed = active.filter((h) => h.recurrenceType === "FIXED_DAYS");

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-[26px] font-bold tracking-tight text-text">Hábitos</h1>
        <p className="text-sm text-text-muted">Gestiona tus hábitos y su recurrencia.</p>
      </header>

      <HabitosTabs active="gestionar" />

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Días concretos</h2>
        {fixed.length === 0 ? (
          <p className="text-sm text-text-faint">Ninguno todavía.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card divide-y divide-border">
            {fixed.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3.5 text-sm">
                <div>
                  <p className="font-medium text-text">{h.name}</p>
                  <p className="mt-0.5 text-xs text-text-faint">
                    {h.weekdays.length === 7 ? "Diario" : h.weekdays.map((d) => WEEKDAY_LABELS[d - 1]).join(" ")}
                    {isCurrentlyPaused(h.pauses) && " · pausado"}
                  </p>
                </div>
                <HabitActions id={h.id} archived={false} paused={isCurrentlyPaused(h.pauses)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Semanal / mensual</h2>
        {quotaHabits.length === 0 ? (
          <p className="text-sm text-text-faint">Ninguno todavía.</p>
        ) : (
          <div className="space-y-2">
            {quotaHabits.map((h) => (
              <div key={h.id} className="space-y-1.5">
                <QuotaToggle
                  habitId={h.id}
                  name={h.name}
                  done={h.done > 0}
                  periodLabel={h.periodLabel}
                  paused={h.paused}
                />
                <div className="flex justify-end pr-1">
                  <HabitActions id={h.id} archived={false} paused={h.paused} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Crear hábito</h2>
        <HabitForm mode="create" />
      </section>

      {archived.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Archivados</h2>
          <div className="space-y-2">
            {archived.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-3.5 text-sm text-text-faint"
              >
                <p>{h.name}</p>
                <HabitActions id={h.id} archived paused={false} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
