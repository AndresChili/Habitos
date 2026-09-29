import Link from "next/link";
import type { HabitDetail } from "@/lib/habits";
import { IconChevronRight } from "@/components/icons";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function pct(n: number | null): string {
  return n === null ? "—" : `${Math.round(n * 100)}%`;
}

export default function HabitStatRow({ detail }: { detail: HabitDetail }) {
  const typeLabel =
    detail.kind === "FIXED_DAYS"
      ? detail.weekdays.length === 7
        ? "Diario"
        : detail.weekdays.map((d) => WEEKDAY_LABELS[d - 1]).join(" ")
      : `Una vez por ${detail.quotaPeriod === "WEEK" ? "semana" : "mes"}`;

  return (
    <Link
      href={`/habitos/${detail.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm shadow-black/[0.03] transition-all active:scale-[0.98] hover:border-text-faint/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text">{detail.name}</p>
        <p className="mt-0.5 text-xs text-text-faint">{typeLabel}</p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-text">{detail.currentStreak}</p>
          <p className="text-[10px] uppercase tracking-wide text-text-faint">racha</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-text">{pct(detail.completionRate)}</p>
          <p className="text-[10px] uppercase tracking-wide text-text-faint">cumpl.</p>
        </div>
        <IconChevronRight className="h-4 w-4 text-text-faint" />
      </div>
    </Link>
  );
}
