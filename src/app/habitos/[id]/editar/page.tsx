import Link from "next/link";
import { notFound } from "next/navigation";
import { getHabit } from "@/lib/habits";
import HabitForm from "@/components/HabitForm";

export const dynamic = "force-dynamic";

export default async function EditarHabitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const habit = await getHabit(id);
  if (!habit) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/habitos"
          className="inline-flex items-center gap-1 text-xs font-medium text-text-faint transition-colors hover:text-text-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Hábitos
        </Link>
        <h1 className="text-[26px] font-bold tracking-tight text-text">Editar hábito</h1>
      </header>

      <HabitForm
        mode="edit"
        habitId={habit.id}
        initial={{
          name: habit.name,
          recurrenceType: habit.recurrenceType,
          weekdays: habit.weekdays,
          quotaPeriod: habit.quotaPeriod,
          quotaTarget: habit.quotaTarget,
        }}
      />
    </div>
  );
}
