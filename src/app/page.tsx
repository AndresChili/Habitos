import { getFixedHabitsForDate, getSettingsTz } from "@/lib/habits";
import { listTasksForDate } from "@/lib/tasks";
import { getLatestWeightBefore, getWeightForDate } from "@/lib/weight";
import { getTodayGymStatus } from "@/lib/workouts";
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

  return (
    <div className="space-y-8">
      <DateNav date={date} todayKey={todayKey} />

      {gymStatus && <GymTodayCard status={gymStatus} />}

      {date === todayKey && (
        <WeightQuickInput
          date={date}
          initialWeight={weight?.weightKg ?? null}
          suggestedWeight={suggestedWeight?.weightKg ?? null}
        />
      )}

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Hábitos</h2>
        {habits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-text-faint">
            Sin hábitos programados este día.
          </p>
        ) : (
          <div className="space-y-2">
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
          <div className="space-y-2">
            {tasks.map((t) => (
              <TaskItem key={t.id} id={t.id} date={date} title={t.title} time={t.time} done={t.done} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
