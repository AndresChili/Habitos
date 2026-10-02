import Link from "next/link";
import { listExercises } from "@/lib/exercises";
import GymTabs from "@/components/GymTabs";
import ExerciseCreateForm from "@/components/ExerciseCreateForm";
import { EQUIPMENT_LABELS, MUSCLE_LABELS, MUSCLE_ORDER } from "@/lib/gymLabels";

export const dynamic = "force-dynamic";

export default async function EjerciciosPage() {
  const exercises = await listExercises();

  const byMuscle = MUSCLE_ORDER.map((muscle) => ({
    muscle,
    items: exercises.filter((e) => e.primaryMuscle === muscle),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-[26px] font-bold tracking-tight text-text">Gimnasio</h1>
        <p className="text-sm text-text-muted">Biblioteca de ejercicios.</p>
      </header>

      <GymTabs active="ejercicios" />

      {byMuscle.map((group) => (
        <section key={group.muscle} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">{MUSCLE_LABELS[group.muscle]}</h2>
          <div className="space-y-1.5">
            {group.items.map((e) => (
              <Link
                key={e.id}
                href={`/gimnasio/ejercicios/${e.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm shadow-card transition-colors hover:border-accent"
              >
                <span className="text-text">{e.name}</span>
                <span className="text-xs text-text-faint">{EQUIPMENT_LABELS[e.equipment]}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <ExerciseCreateForm />
    </div>
  );
}
