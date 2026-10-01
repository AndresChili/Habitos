import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoutine } from "@/lib/routines";
import { listExercises } from "@/lib/exercises";
import { startWorkoutAction } from "@/app/gym-actions";
import RoutineEditForm from "@/components/RoutineEditForm";
import RoutineExerciseList from "@/components/RoutineExerciseList";
import AddExerciseToRoutine from "@/components/AddExerciseToRoutine";

export const dynamic = "force-dynamic";

export default async function RutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [routine, exercises] = await Promise.all([getRoutine(id), listExercises()]);
  if (!routine) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/gimnasio"
          className="inline-flex items-center gap-1 text-xs font-medium text-text-faint transition-colors hover:text-text-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Gimnasio
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-text">Editar rutina</h1>
      </header>

      <form action={startWorkoutAction.bind(null, routine.id)}>
        <button
          type="submit"
          className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-accent-on shadow-sm shadow-black/10 transition-all active:scale-[0.98] hover:bg-accent-strong"
        >
          Empezar entrenamiento
        </button>
      </form>

      <RoutineEditForm
        id={routine.id}
        initialName={routine.name}
        initialDescription={routine.description}
        initialWeekdays={routine.weekdays}
      />

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Ejercicios</h2>
        <RoutineExerciseList
          routineId={routine.id}
          items={routine.exercises.map((re) => ({
            id: re.id,
            targetRepMin: re.targetRepMin,
            targetRepMax: re.targetRepMax,
            exercise: { id: re.exercise.id, name: re.exercise.name, primaryMuscle: re.exercise.primaryMuscle },
          }))}
        />
        <AddExerciseToRoutine
          routineId={routine.id}
          exercises={exercises.map((e) => ({ id: e.id, name: e.name, primaryMuscle: e.primaryMuscle }))}
        />
      </section>
    </div>
  );
}
