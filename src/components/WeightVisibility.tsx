"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Shared open/closed state between the "Peso" chip on Hoy and the weight
// quick-input card below it — they're not siblings in the tree, so this is
// how clicking the chip can toggle a card rendered elsewhere on the page.
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
