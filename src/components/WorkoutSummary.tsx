import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import BackButton from "@/components/BackButton";
import StatTile from "@/components/StatTile";
import { IconCheck, IconStar } from "@/components/icons";
import { MUSCLE_LABELS, SET_TYPE_SHORT } from "@/lib/gymLabels";
import type { MuscleGroup, SetType } from "@/generated/prisma/client";

type SummarySet = { id: string; weightKg: number; reps: number; setType: SetType; isPr: boolean };
type SummaryExercise = { id: string; exerciseName: string; primaryMuscle: MuscleGroup; sets: SummarySet[] };

function formatDuration(minutes: number): string {
  if (minutes < 1) return "<1 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

export default function WorkoutSummary({
  routineName,
  startedAt,
  finishedAt,
  exercises,
  backHref,
}: {
  routineName: string;
  startedAt: Date;
  finishedAt: Date | null;
  exercises: SummaryExercise[];
  backHref: string;
}) {
  const workingSets = exercises.flatMap((ex) => ex.sets.filter((s) => s.setType !== "WARMUP"));
  const totalVolume = workingSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  const prCount = workingSets.filter((s) => s.isPr).length;
  const durationMinutes = finishedAt ? Math.max(0, differenceInMinutes(finishedAt, startedAt)) : null;

  return (
    <div className="space-y-5">
      <BackButton fallbackHref={backHref} />

      <header className="space-y-3 rounded-2xl border border-violet/25 bg-gradient-to-br from-violet-soft to-surface p-4 shadow-card">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs capitalize text-violet-strong">
              {format(startedAt, "EEEE, d 'de' MMMM", { locale: es })}
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight text-text">{routineName}</h1>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-accent-on shadow-glow">
            <IconCheck className="h-4 w-4" />
          </span>
        </div>
        <p className="text-xs font-medium text-violet-strong">Entrenamiento completado</p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatTile accent="violet" label="Duración" value={durationMinutes !== null ? formatDuration(durationMinutes) : "—"} />
        <StatTile accent="violet" label="Ejercicios" value={`${exercises.length}`} />
        <StatTile accent="teal" label="Volumen total" value={`${Math.round(totalVolume)}kg`} hint={`${workingSets.length} series`} />
        <StatTile accent="gold" label="PRs conseguidos" value={`${prCount}`} hint={prCount > 0 ? "¡Enhorabuena!" : undefined} />
      </section>

      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Ejercicios</h2>
        <div className="space-y-2.5">
          {exercises.map((ex) => (
            <div key={ex.id} className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-card">
              <div className="flex items-center gap-2">
                <p className="font-medium text-text">{ex.exerciseName}</p>
                <span className="rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-medium text-violet-strong">
                  {MUSCLE_LABELS[ex.primaryMuscle]}
                </span>
              </div>
              {ex.sets.length === 0 ? (
                <p className="text-xs text-text-faint">Sin series registradas.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {ex.sets.map((s) => (
                    <span
                      key={s.id}
                      className={`inline-flex items-center rounded-xl px-2.5 py-1.5 text-sm ${
                        s.isPr ? "border border-gold/40 bg-gold-soft text-gold-strong" : "bg-surface-muted text-text"
                      }`}
                    >
                      {s.isPr && <IconStar className="mr-1.5 h-3.5 w-3.5 shrink-0 text-gold-strong" />}
                      <span className="font-medium">{s.weightKg}kg</span>&nbsp;× {s.reps}
                      <span className="ml-1.5 text-xs text-text-faint">{SET_TYPE_SHORT[s.setType]}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
