"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun, IconSystem } from "@/components/icons";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; icon: typeof IconSun }[] = [
  { value: "light", label: "Claro", icon: IconSun },
  { value: "dark", label: "Oscuro", icon: IconMoon },
  { value: "system", label: "Sistema", icon: IconSystem },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // Lee localStorage solo después de montar, coincidiendo con el estado
  // "system" renderizado en servidor en el primer pintado — un script
  // inline en layout.tsx ya aplica el tema real antes de pintar, esto solo
  // sincroniza qué botón del selector aparece activo, y tiene que seguir
  // siendo un efecto para evitar un desajuste de hidratación cliente/servidor.
  // También reaplica el atributo (como <ThemeSync />) por si esta tarjeta se
  // monta después de que algo haya dejado la página en un tema distinto al guardado.
  useEffect(() => {
    const stored = getStoredTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function select(value: Theme) {
    setTheme(value);
    applyTheme(value);
    try {
      if (value === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", value);
    } catch {}
  }

  return (
    <div className="flex gap-1.5 rounded-2xl border border-border bg-surface p-1.5 shadow-card">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => select(value)}
          aria-pressed={theme === value}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            theme === value
              ? "bg-gradient-to-br from-accent to-accent-2 text-accent-on"
              : "text-text-muted hover:text-text"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
