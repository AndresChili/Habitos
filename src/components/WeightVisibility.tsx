"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Estado abierto/cerrado compartido entre el chip de "Peso" en Hoy y la
// tarjeta de entrada rápida de peso de más abajo — no son hermanos en el
// árbol, así que esto es lo que permite que al pulsar el chip se alterne una
// tarjeta renderizada en otra parte de la página.
type WeightVisibility = { open: boolean; setOpen: (open: boolean) => void };

const WeightVisibilityContext = createContext<WeightVisibility | null>(null);

export function WeightVisibilityProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <WeightVisibilityContext.Provider value={{ open, setOpen }}>{children}</WeightVisibilityContext.Provider>
  );
}

export function useWeightVisibility(): WeightVisibility {
  const ctx = useContext(WeightVisibilityContext);
  if (!ctx) throw new Error("useWeightVisibility must be used within WeightVisibilityProvider");
  return ctx;
}
