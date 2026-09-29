import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { listWeightHistory } from "@/lib/weight";

export const dynamic = "force-dynamic";

export default async function PesoPage() {
  const history = await listWeightHistory();
  const ordered = [...history].reverse();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Peso</h1>
        <p className="text-sm text-neutral-400">
          El registro del día se hace desde &ldquo;Hoy&rdquo;. Gráfica de evolución pendiente (fase de diseño).
        </p>
      </header>

      {ordered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-400 dark:border-neutral-700">
          Todavía no hay registros de peso.
        </p>
      ) : (
        <div className="space-y-2">
          {ordered.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className="capitalize text-neutral-500">{format(parseISO(w.date), "EEEE, d MMM", { locale: es })}</span>
              <span className="font-medium">{w.weightKg} kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
