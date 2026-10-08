"use client";

import { useState, useTransition } from "react";
import { finishWorkoutAction } from "@/app/gym-actions";
import RestTimer from "@/components/RestTimer";
import WorkoutExerciseCard from "@/components/WorkoutExerciseCard";
import AddExerciseToSession from "@/components/AddExerciseToSession";
import type { MuscleGroup, SetType } from "@/generated/prisma/client";

export type ActiveExercise = {
  workoutExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  targetRepMin: number | null;
  targetRepMax: number | null;
  lastPerformance: { sets: { weightKg: number; reps: number; setType: SetType }[] } | null;
  initialSets: { id: string; weightKg: number; reps: number; setType: SetType; isPr: boolean }[];
  suggestion: { text: string } | null;
};

export default function ActiveWorkout({
  sessionId,
  routineName,
  exercises,
  availableExercises,
}: {
  sessionId: string;
  routineName: string;
  exercises: ActiveExercise[];
  availableExercises: { id: string; name: string; primaryMuscle: MuscleGroup }[];
}) {
  const [resetSignal, setResetSignal] = useState(0);
  const [pending, startTransition] = useTransition();
  // Solo una tarjeta está expandida a la vez (acordeón). Empieza en el
  // primer ejercicio que todavía no tiene series registradas — el resto
  // (incluidos los ya guardados) empieza colapsado.
  const [openId, setOpenId] = useState<string | null>(
    () => exercises.find((e) => e.initialSets.length === 0)?.workoutExerciseId ?? exercises[0]?.workoutExerciseId ?? null
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-medium text-text-faint">Entrenando</p>
        <h1 className="text-xl font-semibold tracking-tight text-text">{routineName}</h1>
      </header>

      <RestTimer sessionId={sessionId} resetSignal={resetSignal} />

      <div className="space-y-3">
        {exercises.map((ex) => (
          <WorkoutExerciseCard
            key={ex.workoutExerciseId}
            workoutExerciseId={ex.workoutExerciseId}
            exerciseId={ex.exerciseId}
            sessionId={sessionId}
            exerciseName={ex.exerciseName}
            primaryMuscle={ex.primaryMuscle}
            targetRepMin={ex.targetRepMin}
            targetRepMax={ex.targetRepMax}
            lastPerformance={ex.lastPerformance}
            initialSets={ex.initialSets}
            suggestion={ex.suggestion}
            onSetLogged={() => setResetSignal((n) => n + 1)}
            open={openId === ex.workoutExerciseId}
            onOpen={() => setOpenId(ex.workoutExerciseId)}
            onSaved={() => setOpenId(null)}
          />
        ))}
      </div>

      <AddExerciseToSession sessionId={sessionId} exercises={availableExercises} />

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => finishWorkoutAction(sessionId))}
        className="w-full rounded-2xl bg-gradient-to-br from-violet to-violet-2 py-3.5 text-sm font-semibold text-violet-on shadow-glow-violet transition-all active:scale-[0.98] disabled:opacity-50"
      >
        Finalizar entrenamiento
      </button>
    </div>
  );
}
