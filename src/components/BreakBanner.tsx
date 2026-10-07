import { IconPause } from "@/components/icons";
import { BREAK_REASON_LABELS, formatBreakRange } from "@/lib/breakLabels";
import type { Break } from "@/generated/prisma/client";

export default function BreakBanner({ brk }: { brk: Break }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3.5 shadow-card">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue to-blue-2 text-blue-on">
        <IconPause className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{BREAK_REASON_LABELS[brk.reason]}</p>
        <p className="text-xs text-text-faint">
          {formatBreakRange(brk.fromDate, brk.toDate)}
          {brk.note ? ` · ${brk.note}` : ""}
        </p>
      </div>
    </div>
  );
}
