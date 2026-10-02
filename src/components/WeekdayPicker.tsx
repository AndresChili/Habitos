"use client";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export default function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (next: number[]) => void;
}) {
  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  }

  return (
    <div className="flex justify-between gap-1">
      {WEEKDAY_LABELS.map((label, i) => {
        const day = i + 1;
        const active = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all active:scale-90 ${
              active ? "bg-gradient-to-br from-accent to-accent-2 text-accent-on shadow-glow" : "bg-surface-muted text-text-muted"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
