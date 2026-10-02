import { getFixedHabitsForDate, getSettingsTz } from "@/lib/habits";
import { listTasksForDate } from "@/lib/tasks";
import { getLatestWeightBefore, getWeightForDate } from "@/lib/weight";
import { getTodayGymStatus } from "@/lib/workouts";
import { listRoutines } from "@/lib/routines";
import { dayKey, nowInTz } from "@/lib/dates";
import HabitToggle from "@/components/HabitToggle";
import TaskForm from "@/components/TaskForm";
import TaskItem from "@/components/TaskItem";
import WeightQuickInput from "@/components/WeightQuickInput";
import DateNav from "@/components/DateNav";
import GymTodayCard from "@/components/GymTodayCard";

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

  const suggestedWeight =
    date === todayKey && weight === null ? await getLatestWeightBefore(date) : null;

  const otherRoutines =
    gymStatus?.scheduled && !gymStatus.session
      ? (await listRoutines()).filter((r) => r.id !== gymStatus.assignedRoutine?.id)
      : [];

  const habitsDone = habits.filter((h) => h.done).length;

  return (
    <div className="space-y-8">
      <DateNav date={date} todayKey={todayKey} habitsDone={habitsDone} habitsTotal={habits.length} />

      {gymStatus && <GymTodayCard status={gymStatus} otherRoutines={otherRoutines} />}

      {date === todayKey && (
        <WeightQuickInput
          date={date}
          initialWeight={weight?.weightKg ?? null}
          suggestedWeight={suggestedWeight?.weightKg ?? null}
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
  );
}
