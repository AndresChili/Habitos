import { ensureUnlocks, listHabits } from "@/lib/habits";
import CreateHabitForm from "@/components/CreateHabitForm";
import ArchiveButton from "@/components/ArchiveButton";
import type { Frequency, Habit } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const LABELS: Record<Frequency, string> = {
  DAILY: "Diarios",
  WEEKLY: "Semanales",
  MONTHLY: "Mensuales",
};

function Group({
  frequency,
  habits,
  cap,
}: {
  frequency: Frequency;
  habits: Habit[];
  cap: number;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-neutral-500">{LABELS[frequency]}</h2>
        <span className="text-xs text-neutral-400">
          {habits.length}/{cap} slots
        </span>
      </div>

      {habits.length > 0 && (
        <div className="space-y-2">
          {habits.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span>{h.name}</span>
              <ArchiveButton id={h.id} />
            </div>
          ))}
        </div>
      )}

      <CreateHabitForm frequency={frequency} disabled={habits.length >= cap} />
    </section>
  );
}

export default async function HabitosPage() {
  const settings = await ensureUnlocks();
  const habits = await listHabits();

  const daily = habits.filter((h) => h.frequency === "DAILY");
  const weekly = habits.filter((h) => h.frequency === "WEEKLY");
  const monthly = habits.filter((h) => h.frequency === "MONTHLY");

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Hábitos</h1>
        <p className="text-sm text-neutral-400">
          Cumple tus hábitos para desbloquear más slots cada semana y cada mes.
        </p>
      </header>

      <Group frequency="DAILY" habits={daily} cap={settings.dailyCap} />
      <Group frequency="WEEKLY" habits={weekly} cap={settings.weeklyCap} />
      <Group frequency="MONTHLY" habits={monthly} cap={settings.monthlyCap} />
    </div>
  );
}
