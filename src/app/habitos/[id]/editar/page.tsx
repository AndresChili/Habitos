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
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Editar hábito</h1>
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
