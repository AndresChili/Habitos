"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteHistoryEntryAction } from "@/app/gym-actions";
import { IconTrash } from "@/components/icons";
import { SET_TYPE_SHORT } from "@/lib/gymLabels";
import type { SetType } from "@/generated/prisma/client";

export default function HistoryEntry({
  id,
  exerciseId,
  dateLabel,
  sets,
}: {
  id: string;
  exerciseId: string;
  dateLabel: string;
  sets: { id: string; weightKg: number; reps: number; setType: SetType }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar este registro? No se puede deshacer.")) return;
    startTransition(async () => {
      await deleteHistoryEntryAction(id, exerciseId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-card">
      <div className="min-w-0 flex-1">
        <p className="text-xs capitalize text-text-faint">{dateLabel}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text">
          {sets.map((s) => (
            <span key={s.id}>
              {s.weightKg}×{s.reps}
              <span className="text-xs text-text-faint"> {SET_TYPE_SHORT[s.setType]}</span>
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="shrink-0 rounded-lg p-1.5 text-text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        aria-label="Eliminar registro"
      >
        <IconTrash className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
