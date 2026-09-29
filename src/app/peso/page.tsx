import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { listWeightHistory } from "@/lib/weight";
import WeightChart from "@/components/WeightChart";

export const dynamic = "force-dynamic";

export default async function PesoPage() {
  const history = await listWeightHistory();
  const ordered = [...history].reverse();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-text">Peso</h1>
        <p className="text-sm text-text-muted">El registro del día se hace desde &ldquo;Hoy&rdquo;.</p>
      </header>

      {history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-faint">
          Todavía no hay registros de peso.
        </p>
      ) : (
        <>
          <WeightChart data={history.map((w) => ({ date: w.date, weightKg: w.weightKg }))} />

          <section className="space-y-2">
            <h2 className="text-sm font-medium text-text-muted">Histórico</h2>
            <div className="space-y-1.5">
              {ordered.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
                  <span className="capitalize text-text-muted">{format(parseISO(w.date), "EEEE, d MMM", { locale: es })}</span>
                  <span className="font-medium text-text">{w.weightKg} kg</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
