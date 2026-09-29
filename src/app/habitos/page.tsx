import { getQuotaHabits, getSettingsTz, isCurrentlyPaused, listHabits } from "@/lib/habits";
import HabitForm from "@/components/HabitForm";
import HabitActions from "@/components/HabitActions";

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
        <h1 className="text-2xl font-semibold text-text">Hábitos</h1>
        <p className="text-sm text-text-muted">Gestiona tus hábitos y su recurrencia.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">Días fijos</h2>
        {fixed.length === 0 ? (
          <p className="text-sm text-text-faint">Ninguno todavía.</p>
        ) : (
          <div className="space-y-2">
            {fixed.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <div>
                  <p className="text-text">{h.name}</p>
                  <p className="text-xs text-text-faint">
                    {h.weekdays.map((d) => WEEKDAY_LABELS[d - 1]).join(" ")}
                    {isCurrentlyPaused(h.pauses) && " · pausado"}
                  </p>
                </div>
                <HabitActions id={h.id} archived={false} paused={isCurrentlyPaused(h.pauses)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">Cuota por periodo</h2>
        {quotaHabits.length === 0 ? (
          <p className="text-sm text-text-faint">Ninguno todavía.</p>
        ) : (
          <div className="space-y-2">
            {quotaHabits.map((h) => (
              <div key={h.id} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-text">{h.name}</p>
                  <HabitActions id={h.id} archived={false} paused={h.paused} />
                </div>
                <p className="mt-1 text-xs text-text-faint">
                  {h.paused ? "pausado" : `${h.done}/${h.quotaTarget} ${h.periodLabel}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">Crear hábito</h2>
        <HabitForm mode="create" />
      </section>

      {archived.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-muted">Archivados</h2>
          <div className="space-y-2">
            {archived.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-faint">
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
