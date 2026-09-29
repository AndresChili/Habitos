import { getFixedHabitsForDate, getSettingsTz } from "@/lib/habits";
import { listTasksForDate } from "@/lib/tasks";
import { getWeightForDate } from "@/lib/weight";
import { dayKey, nowInTz } from "@/lib/dates";
import HabitToggle from "@/components/HabitToggle";
import TaskForm from "@/components/TaskForm";
import TaskItem from "@/components/TaskItem";
import WeightQuickInput from "@/components/WeightQuickInput";
import DateNav from "@/components/DateNav";

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

  const [habits, tasks, weight] = await Promise.all([
    getFixedHabitsForDate(date),
    listTasksForDate(date),
    date === todayKey ? getWeightForDate(date) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <DateNav date={date} todayKey={todayKey} />

      {date === todayKey && <WeightQuickInput date={date} initialWeight={weight?.weightKg ?? null} />}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Hábitos</h2>
        {habits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-400 dark:border-neutral-700">
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

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-500">Tareas</h2>
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
