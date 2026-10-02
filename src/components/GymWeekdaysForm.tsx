"use client";

import { useState, useTransition } from "react";
import { updateGymWeekdaysAction } from "@/app/gym-actions";
import WeekdayPicker from "@/components/WeekdayPicker";

export default function GymWeekdaysForm({ initial }: { initial: number[] }) {
  const [weekdays, setWeekdays] = useState(initial);
  const [saved, setSaved] = useState(true);
  const [pending, startTransition] = useTransition();

  function change(next: number[]) {
    setWeekdays(next);
    setSaved(false);
    startTransition(async () => {
      await updateGymWeekdaysAction(next);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Días de entrenamiento</h2>
        {pending ? (
          <span className="text-[10px] text-text-faint">Guardando...</span>
        ) : saved && weekdays.length > 0 ? (
          <span className="text-[10px] text-text-faint">Guardado</span>
        ) : null}
      </div>
      <WeekdayPicker value={weekdays} onChange={change} />
      <p className="text-xs text-text-faint">
        {weekdays.length === 0
          ? "Marca los días que entrenas para que aparezca en “Hoy”."
          : "Asigna una rutina a cada día marcado para que aparezca directamente en “Hoy”."}
      </p>
    </div>
  );
}
