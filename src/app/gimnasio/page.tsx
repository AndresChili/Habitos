import { listRoutines } from "@/lib/routines";
import GymTabs from "@/components/GymTabs";
import RoutineCard from "@/components/RoutineCard";
import RoutineForm from "@/components/RoutineForm";

export const dynamic = "force-dynamic";

export default async function GimnasioPage() {
  const routines = await listRoutines();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Gimnasio</h1>
        <p className="text-sm text-text-muted">Tus rutinas y entrenamientos.</p>
      </header>

      <GymTabs active="rutinas" />

      {routines.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-faint">
          Todavía no tienes rutinas.
        </p>
      ) : (
        <div className="space-y-2.5">
          {routines.map((r) => (
            <RoutineCard key={r.id} id={r.id} name={r.name} description={r.description} exerciseCount={r.exercises.length} />
          ))}
        </div>
      )}

      <RoutineForm />
    </div>
  );
}
