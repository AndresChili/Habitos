"use client";

import { useState, useTransition } from "react";
import { finishWorkoutAction } from "@/app/gym-actions";
import RestTimer from "@/components/RestTimer";
import WorkoutExerciseCard from "@/components/WorkoutExerciseCard";
import AddExerciseToSession from "@/components/AddExerciseToSession";
import type { MuscleGroup, SetType } from "@/generated/prisma/client";

export type ActiveExercise = {
  workoutExerciseId: string;
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
}: {
  sessionId: string;
  routineName: string;
  exercises: ActiveExercise[];
  availableExercises: { id: string; name: string; primaryMuscle: MuscleGroup }[];
}) {
  const [resetSignal, setResetSignal] = useState(0);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-medium text-text-faint">Entrenando</p>
        <h1 className="text-xl font-semibold tracking-tight text-text">{routineName}</h1>
      </header>

      <RestTimer resetSignal={resetSignal} />

      <div className="space-y-3">
        {exercises.map((ex) => (
          <WorkoutExerciseCard
            key={ex.workoutExerciseId}
            workoutExerciseId={ex.workoutExerciseId}
            sessionId={sessionId}
            exerciseName={ex.exerciseName}
            primaryMuscle={ex.primaryMuscle}
            targetRepMin={ex.targetRepMin}
            targetRepMax={ex.targetRepMax}
            lastPerformance={ex.lastPerformance}
            initialSets={ex.initialSets}
            suggestion={ex.suggestion}
            onSetLogged={() => setResetSignal((n) => n + 1)}
          />
        ))}
      </div>

      <AddExerciseToSession sessionId={sessionId} exercises={availableExercises} />

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => finishWorkoutAction(sessionId))}
        className="w-full rounded-2xl bg-gradient-to-br from-accent to-accent-2 py-3.5 text-sm font-semibold text-accent-on shadow-glow transition-all active:scale-[0.98] disabled:opacity-50"
      >
        Finalizar entrenamiento
      </button>
    </div>
  );
}
