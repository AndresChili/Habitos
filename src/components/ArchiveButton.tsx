"use client";

import { useTransition } from "react";
import { archiveHabitAction } from "@/app/actions";

export default function ArchiveButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => archiveHabitAction(id))}
      className="text-xs text-neutral-400 transition hover:text-red-500 disabled:opacity-50"
    >
      Archivar
    </button>
  );
}
