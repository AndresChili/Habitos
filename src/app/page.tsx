import { parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { getTodayView, type TodayHabit } from "@/lib/habits";
import HabitToggle from "@/components/HabitToggle";

export const dynamic = "force-dynamic";

function Section({
  title,
  items,
  date,
  emptyHint,
}: {
  title: string;
  items: TodayHabit[];
  date: string;
  emptyHint: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-neutral-500">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-400 dark:border-neutral-700">
          {emptyHint}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((h) => (
            <HabitToggle
              key={h.id}
              habitId={h.id}
              date={date}
              name={h.name}
              done={h.done}
              streak={h.streak}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function TodayPage() {
  const view = await getTodayView();
  const label = format(parseISO(view.date), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm capitalize text-neutral-400">{label}</p>
        <h1 className="text-2xl font-semibold">Hoy</h1>
      </header>

      <Section title="Diarios" items={view.daily} date={view.date} emptyHint="Sin hábitos diarios todavía. Ve a Hábitos para crear el primero." />
      <Section title="Semanales" items={view.weekly} date={view.date} emptyHint="Sin hábitos semanales todavía." />
      <Section title="Mensuales" items={view.monthly} date={view.date} emptyHint="Sin hábitos mensuales todavía." />
    </div>
  );
}
