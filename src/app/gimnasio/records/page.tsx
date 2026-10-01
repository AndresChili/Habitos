import Link from "next/link";
import { listAllPRs } from "@/lib/workouts";
import GymTabs from "@/components/GymTabs";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const prs = await listAllPRs();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Gimnasio</h1>
        <p className="text-sm text-text-muted">Tus récords personales.</p>
      </header>

      <GymTabs active="records" />

      {prs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-faint">
          Entrena algún ejercicio para empezar a ver récords aquí.
        </p>
      ) : (
        <div className="space-y-2">
          {prs.map((pr) => (
            <Link
              key={pr.exerciseId}
              href={`/gimnasio/ejercicios/${pr.exerciseId}`}
              className="block space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03] transition-colors hover:border-accent"
            >
              <p className="font-medium text-text">{pr.exerciseName}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-faint">
                {pr.bestWeight && (
                  <span>
                    <span className="font-semibold text-text">{pr.bestWeight.weightKg}kg</span> × {pr.bestWeight.reps} máx.
                  </span>
                )}
                {pr.bestReps && (
                  <span>
                    <span className="font-semibold text-text">{pr.bestReps.reps}</span> reps a {pr.bestReps.weightKg}kg
                  </span>
                )}
                {pr.bestEstimatedOneRm && (
                  <span>
                    e1RM <span className="font-semibold text-text">{Math.round(pr.bestEstimatedOneRm.value)}kg</span>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
