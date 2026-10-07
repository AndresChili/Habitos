"use client";

import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@/components/icons";

// Usa el historial del navegador cuando lo hay (vuelve a donde sea que se
// entró: Hoy, el calendario, etc.) y cae a `fallbackHref` cuando no — por
// ejemplo si se abrió el enlace directamente, sin navegación previa en la app.
export default function BackButton({ fallbackHref, label = "Atrás" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="inline-flex items-center gap-1 text-xs font-medium text-text-faint transition-colors hover:text-text-muted"
    >
      <IconArrowLeft className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
