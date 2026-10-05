import { getQuotaHabits, getSettingsTz, isCurrentlyPaused, listHabits } from "@/lib/habits";
import HabitForm from "@/components/HabitForm";
import HabitsByType from "@/components/HabitsByType";

export const dynamic = "force-dynamic";

export default async function HabitosPage() {
  const tz = await getSettingsTz();
  const [allHabits, quotaHabits] = await Promise.all([listHabits(true), getQuotaHabits(tz)]);

  const active = allHabits.filter((h) => !h.archivedAt);
  const archived = allHabits.filter((h) => h.archivedAt);
  const fixed = active.filter((h) => h.recurrenceType === "FIXED_DAYS");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-[26px] font-bold tracking-tight text-text">Hábitos</h1>
        <p className="text-sm text-text-muted">Gestiona tus hábitos y su recurrencia.</p>
      </header>

      <HabitForm mode="create" />

      <HabitsByType
        fixed={fixed.map((h) => ({ id: h.id, name: h.name, weekdays: h.weekdays, paused: isCurrentlyPaused(h.pauses) }))}
        quota={quotaHabits.map((h) => ({ id: h.id, name: h.name, done: h.done, periodLabel: h.periodLabel, paused: h.paused }))}
        archivedFixed={archived.filter((h) => h.recurrenceType === "FIXED_DAYS").map((h) => ({ id: h.id, name: h.name }))}
        archivedQuota={archived.filter((h) => h.recurrenceType === "QUOTA").map((h) => ({ id: h.id, name: h.name }))}
      />
    </div>
  );
}
