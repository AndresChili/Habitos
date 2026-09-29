import type { HeatCell } from "@/lib/habits";

const STATE_CLASS: Record<HeatCell["state"], string> = {
  done: "bg-accent",
  missed: "bg-warn-soft border border-warn/50",
  today_pending: "border-2 border-accent",
  not_scheduled: "bg-surface-muted",
  future: "bg-surface-muted",
};

export default function HabitHeatmap({ cells }: { cells: HeatCell[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03]">
      <div className="overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-[3px]">
          {cells.map((c) => (
            <div key={c.date} title={c.date} className={`h-3.5 w-3.5 rounded-[4px] ${STATE_CLASS[c.state]}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
