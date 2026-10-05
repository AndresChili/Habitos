"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
  initialSets: { id: string; weightKg: number; reps: number; setType: SetType }[];
  suggestion: { text: string } | null;
};

export default function ActiveWorkout({
  sessionId,
  routineName,
  exercises,
  availableExercises,
  completed = false,
}: {
  sessionId: string;
  routineName: string;
  exercises: ActiveExercise[];
  availableExercises: { id: string; name: string; primaryMuscle: MuscleGroup }[];
  completed?: boolean;
}) {
  const [resetSignal, setResetSignal] = useState(0);
  const [pending, startTransition] = useTransition();
  // Only one card is expanded at a time (accordion). Start on the first
  // exercise that doesn't have sets logged yet — everything else (including
  // already-saved exercises) starts collapsed.
  const [openId, setOpenId] = useState<string | null>(
    () => exercises.find((e) => e.initialSets.length === 0)?.workoutExerciseId ?? exercises[0]?.workoutExerciseId ?? null
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-medium text-text-faint">{completed ? "Entrenamiento completado" : "Entrenando"}</p>
        <h1 className="text-xl font-semibold tracking-tight text-text">{routineName}</h1>
      </header>

      {!completed && <RestTimer resetSignal={resetSignal} />}

      <div className="space-y-3">
        {exercises.map((ex, index) => (
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
            onSaved={() => setOpenId(exercises[index + 1]?.workoutExerciseId ?? null)}
            readOnly={completed}
          />
        ))}
      </div>

      {!completed && <AddExerciseToSession sessionId={sessionId} exercises={availableExercises} />}

      {completed ? (
        <Link
          href="/gimnasio/calendario"
          className="block w-full rounded-2xl border border-border py-3.5 text-center text-sm font-semibold text-text-muted transition-all active:scale-[0.98]"
        >
          Volver al calendario
        </Link>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => finishWorkoutAction(sessionId))}
          className="w-full rounded-2xl bg-gradient-to-br from-violet to-violet-2 py-3.5 text-sm font-semibold text-violet-on shadow-glow-violet transition-all active:scale-[0.98] disabled:opacity-50"
        >
          Finalizar entrenamiento
        </button>
      )}
    </div>
  );
}
