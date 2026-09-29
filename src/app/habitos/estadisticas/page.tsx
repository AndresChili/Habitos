import { getHabitDetail, getSettingsTz, listHabits, type HabitDetail } from "@/lib/habits";
import HabitosTabs from "@/components/HabitosTabs";
import HabitStatRow from "@/components/HabitStatRow";
import StatTile from "@/components/StatTile";

export const dynamic = "force-dynamic";

export default async function HabitosEstadisticasPage() {
  const tz = await getSettingsTz();
  const habits = await listHabits(false);
  const details = (await Promise.all(habits.map((h) => getHabitDetail(h.id, tz)))).filter(
    (d): d is HabitDetail => d !== null
  );

  const rates = details.map((d) => d.completionRate).filter((r): r is number => r !== null);
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
  const longestStreak = details.reduce((max, d) => Math.max(max, d.currentStreak), 0);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Hábitos</h1>
        <p className="text-sm text-text-muted">Vista general de tu progreso.</p>
      </header>

      <HabitosTabs active="estadisticas" />

      {details.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-faint">
          Crea algún hábito para ver estadísticas.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Hábitos activos" value={details.length.toString()} />
            <StatTile
              label="Cumplimiento medio"
              value={avgRate === null ? "—" : `${Math.round(avgRate * 100)}%`}
              hint="últimas 6 semanas / periodos"
            />
          </div>

          {longestStreak > 0 && <StatTile label="Mejor racha activa" value={longestStreak.toString()} hint="días o periodos" />}

          <section className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Por hábito</h2>
            <div className="space-y-2">
              {details.map((d) => (
                <HabitStatRow key={d.id} detail={d} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
