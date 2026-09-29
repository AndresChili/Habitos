import type { HeatCell } from "@/lib/habits";

const STATE_CLASS: Record<HeatCell["state"], string> = {
  done: "bg-accent",
  missed: "bg-warn-soft border border-warn/50",
  today_pending: "border border-accent",
  not_scheduled: "bg-surface-muted",
  future: "bg-surface-muted",
};

export default function HabitHeatmap({ cells }: { cells: HeatCell[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {cells.map((c) => (
          <div key={c.date} title={c.date} className={`h-3 w-3 rounded-sm ${STATE_CLASS[c.state]}`} />
        ))}
      </div>
    </div>
  );
}
