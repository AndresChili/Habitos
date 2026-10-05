import Link from "next/link";
import { getFixedHabitsForDate, getSettingsTz } from "@/lib/habits";
import { listTasksForDate } from "@/lib/tasks";
import { getLatestWeightBefore, getWeightForDate } from "@/lib/weight";
import { getTodayGymStatus } from "@/lib/workouts";
import { listRoutines } from "@/lib/routines";
import { dayKey, isoWeekday, nowInTz } from "@/lib/dates";
import { WEEKDAY_NAMES } from "@/lib/gymLabels";
import HabitToggle from "@/components/HabitToggle";
import TaskForm from "@/components/TaskForm";
import TaskItem from "@/components/TaskItem";
import WeightQuickInput from "@/components/WeightQuickInput";
import WeightChip from "@/components/WeightChip";
import { WeightVisibilityProvider } from "@/components/WeightVisibility";
import DateNav from "@/components/DateNav";
import GymTodayCard from "@/components/GymTodayCard";
import { IconClock, IconGym } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const tz = await getSettingsTz();
  const todayKey = dayKey(nowInTz(tz));
  const date = params.date ?? todayKey;

  const [habits, tasks, weight, gymStatus] = await Promise.all([
    getFixedHabitsForDate(date),
    listTasksForDate(date),
    date === todayKey ? getWeightForDate(date) : Promise.resolve(null),
    date === todayKey ? getTodayGymStatus() : Promise.resolve(null),
  ]);

  const previousWeight = date === todayKey ? await getLatestWeightBefore(date) : null;
  const suggestedWeight = weight === null ? previousWeight : null;

  const otherRoutines =
    gymStatus?.scheduled && !gymStatus.session
      ? (await listRoutines()).filter((r) => r.id !== gymStatus.assignedRoutine?.id)
      : [];

  const habitsDone = habits.filter((h) => h.done).length;
  const pendingTasks = tasks.filter((t) => !t.done).length;
  // A fixed, short label (the weekday) instead of the routine name — a long
  // routine name would otherwise make this card grow relative to the other
  // two on the row.
  const gymChipLabel = WEEKDAY_NAMES[isoWeekday(nowInTz(tz)) - 1];

  return (
    <WeightVisibilityProvider>
    <div className="space-y-8">
      <DateNav date={date} todayKey={todayKey} habitsDone={habitsDone} habitsTotal={habits.length} />

      {date === todayKey && (gymStatus?.scheduled || weight !== null || tasks.length > 0) && (
        <div className="flex gap-2.5">
          {gymStatus?.scheduled && (
            <Link href="/gimnasio" className="flex-1 rounded-2xl border border-border bg-surface p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[9px] bg-gradient-to-br from-violet to-violet-2 text-violet-on">
                <IconGym className="h-3.5 w-3.5" />
              </span>
              <p className="mt-1.5 text-[11px] font-semibold text-text-faint">Gimnasio</p>
              <p className="truncate text-sm font-bold text-text">{gymChipLabel}</p>
            </Link>
          )}
          <WeightChip weightKg={weight?.weightKg ?? suggestedWeight?.weightKg ?? "—"} />
          <div className="flex-1 rounded-2xl border border-border bg-surface p-3 shadow-card">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[9px] bg-gradient-to-br from-blue to-blue-2 text-blue-on">
              <IconClock className="h-3.5 w-3.5" />
            </span>
            <p className="mt-1.5 text-[11px] font-semibold text-text-faint">Tareas</p>
            <p className="truncate text-sm font-bold text-text">
              {pendingTasks === 0 ? "Al día" : `${pendingTasks} pendiente${pendingTasks === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      )}

      {gymStatus && <GymTodayCard status={gymStatus} otherRoutines={otherRoutines} />}

      {date === todayKey && (
        <WeightQuickInput
          date={date}
          initialWeight={weight?.weightKg ?? null}
          suggestedWeight={suggestedWeight?.weightKg ?? null}
          previousWeight={previousWeight?.weightKg ?? null}
        />
      )}

      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Hábitos</h2>
          {habits.length > 0 && (
            <span className="text-xs font-bold text-accent-strong">
              {habitsDone}/{habits.length}
            </span>
          )}
        </div>
        {habits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-text-faint">
            Sin hábitos programados este día.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card divide-y divide-border">
            {habits.map((h) => (
              <HabitToggle key={h.id} habitId={h.id} date={date} name={h.name} done={h.done} streak={h.streak} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Tareas</h2>
        <TaskForm date={date} />
        {tasks.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card divide-y divide-border">
            {tasks.map((t) => (
              <TaskItem key={t.id} id={t.id} date={date} title={t.title} time={t.time} done={t.done} />
            ))}
          </div>
        )}
      </section>
    </div>
    </WeightVisibilityProvider>
  );
}
