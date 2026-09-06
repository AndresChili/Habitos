import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getMonthGrid, getSettings, nextMonth, prevMonth, type DayCellState } from "@/lib/habits";
import { nowInTz } from "@/lib/dates";

export const dynamic = "force-dynamic";

const CELL_STYLES: Record<DayCellState, string> = {
  done: "bg-emerald-500",
  missed: "bg-red-400",
  pending: "border border-neutral-300 dark:border-neutral-600",
  future: "bg-neutral-100 dark:bg-neutral-900",
  none: "bg-neutral-100 dark:bg-neutral-900",
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const now = nowInTz(settings.timezone);

  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const grid = await getMonthGrid(year, month);
  const prev = prevMonth(year, month);
  const next = nextMonth(year, month);
  const label = format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Link
          href={`/calendario?year=${prev.year}&month=${prev.month}`}
          className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          ←
        </Link>
        <h1 className="text-lg font-medium capitalize">{label}</h1>
        <Link
          href={`/calendario?year=${next.year}&month=${next.month}`}
          className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          →
        </Link>
      </header>

      {grid.rows.length === 0 ? (
        <p className="text-sm text-neutral-400">Sin hábitos todavía.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-neutral-50 pr-2 text-left font-normal text-neutral-400 dark:bg-neutral-950" />
                  {grid.days.map((d) => (
                    <th key={d} className="w-4 font-normal text-neutral-400">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-neutral-50 pr-2 text-left dark:bg-neutral-950">
                      {row.name}
                    </td>
                    {row.cells.map((state, i) => (
                      <td key={i}>
                        <div
                          className={`h-4 w-4 rounded-sm ${CELL_STYLES[state]}`}
                          title={`${row.name} · día ${grid.days[i]}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-emerald-500" /> cumplido
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-red-400" /> fallado (diario)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm border border-neutral-300 dark:border-neutral-600" /> hoy, pendiente
            </span>
          </div>
        </>
      )}
    </div>
  );
}
