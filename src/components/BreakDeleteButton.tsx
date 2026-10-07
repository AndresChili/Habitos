"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBreakAction } from "@/app/actions";
import { IconTrash } from "@/components/icons";

export default function BreakDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta pausa? Los hábitos y el gimnasio volverán a contar normal esos días.")) return;
    startTransition(async () => {
      await deleteBreakAction(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleDelete}
      className="shrink-0 rounded-lg p-1.5 text-text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
      aria-label="Eliminar pausa"
    >
      <IconTrash className="h-3.5 w-3.5" />
    </button>
  );
}
