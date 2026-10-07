import { notFound } from "next/navigation";
import { getSession, getLastPerformance, getSuggestion, getPrHistory } from "@/lib/workouts";
import { listExercises } from "@/lib/exercises";
import { prisma } from "@/lib/db";
import ActiveWorkout, { type ActiveExercise } from "@/components/ActiveWorkout";
import WorkoutSummary from "@/components/WorkoutSummary";

export const dynamic = "force-dynamic";

export default async function EntrenarPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) notFound();

  if (session.status === "COMPLETED") {
    return (
      <WorkoutSummary
        routineName={session.routineName}
        startedAt={session.startedAt}
        finishedAt={session.finishedAt}
        backHref="/gimnasio/calendario"
        exercises={session.exercises.map((we) => ({
          id: we.id,
          exerciseName: we.exercise.name,
          primaryMuscle: we.exercise.primaryMuscle,
          sets: we.sets.map((s) => ({ id: s.id, weightKg: s.weightKg, reps: s.reps, setType: s.setType, isPr: s.isPr })),
        }))}
      />
    );
  }

  const availableExercises = await listExercises();

  const repTargets = session.routineId
    ? await prisma.routineExercise.findMany({
        where: { routineId: session.routineId },
        select: { exerciseId: true, targetRepMin: true, targetRepMax: true },
      })
    : [];
  const targetByExercise = new Map(repTargets.map((t) => [t.exerciseId, t]));

  const exercises: ActiveExercise[] = await Promise.all(
    session.exercises.map(async (we) => {
      const [lastPerformance, suggestion, prHistory] = await Promise.all([
        getLastPerformance(we.exerciseId, sessionId),
        we.sets.length > 0 ? getSuggestion(we.exerciseId, sessionId) : Promise.resolve(null),
        getPrHistory(we.exerciseId),
      ]);
      const target = targetByExercise.get(we.exerciseId);

      return {
        workoutExerciseId: we.id,
        exerciseId: we.exerciseId,
        exerciseName: we.exercise.name,
        primaryMuscle: we.exercise.primaryMuscle,
        targetRepMin: target?.targetRepMin ?? null,
        targetRepMax: target?.targetRepMax ?? null,
        lastPerformance: lastPerformance ? { sets: lastPerformance.sets } : null,
        initialSets: we.sets.map((s) => ({ id: s.id, weightKg: s.weightKg, reps: s.reps, setType: s.setType, isPr: s.isPr })),
        prHistory,
        suggestion,
      };
    })
  );

  return (
    <ActiveWorkout
      sessionId={session.id}
      routineName={session.routineName}
      exercises={exercises}
      availableExercises={availableExercises.map((e) => ({ id: e.id, name: e.name, primaryMuscle: e.primaryMuscle }))}
    />
  );
}
