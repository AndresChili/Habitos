import { notFound } from "next/navigation";
import { getSession, getLastPerformance, getSuggestion } from "@/lib/workouts";
import { listExercises } from "@/lib/exercises";
import { prisma } from "@/lib/db";
import ActiveWorkout, { type ActiveExercise } from "@/components/ActiveWorkout";

export const dynamic = "force-dynamic";

export default async function EntrenarPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const [session, availableExercises] = await Promise.all([getSession(sessionId), listExercises()]);
  if (!session) notFound();

  const repTargets = session.routineId
    ? await prisma.routineExercise.findMany({
        where: { routineId: session.routineId },
        select: { exerciseId: true, targetRepMin: true, targetRepMax: true },
      })
    : [];
  const targetByExercise = new Map(repTargets.map((t) => [t.exerciseId, t]));

  const exercises: ActiveExercise[] = await Promise.all(
    session.exercises.map(async (we) => {
      const [lastPerformance, suggestion] = await Promise.all([
        getLastPerformance(we.exerciseId, sessionId),
        we.sets.length > 0 ? getSuggestion(we.exerciseId, sessionId) : Promise.resolve(null),
      ]);
      const target = targetByExercise.get(we.exerciseId);

      return {
        workoutExerciseId: we.id,
        exerciseName: we.exercise.name,
        primaryMuscle: we.exercise.primaryMuscle,
        targetRepMin: target?.targetRepMin ?? null,
        targetRepMax: target?.targetRepMax ?? null,
        lastPerformance: lastPerformance ? { sets: lastPerformance.sets } : null,
        initialSets: we.sets.map((s) => ({ id: s.id, weightKg: s.weightKg, reps: s.reps, setType: s.setType })),
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
