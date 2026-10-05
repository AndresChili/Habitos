"use client";

import { IconWeight } from "@/components/icons";
import { useWeightVisibility } from "@/components/WeightVisibility";

export default function WeightChip({ weightKg }: { weightKg: number | string }) {
  const { open, setOpen } = useWeightVisibility();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="flex-1 rounded-2xl border border-border bg-surface p-3 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[9px] bg-gradient-to-br from-rose to-rose-2 text-rose-on">
        <IconWeight className="h-3.5 w-3.5" />
      </span>
      <p className="mt-1.5 text-[11px] font-semibold text-text-faint">Peso</p>
      <p className="truncate text-sm font-bold text-text">
        {weightKg} <span className="text-xs font-semibold text-text-faint">kg</span>
      </p>
    </button>
  );
}
