"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun, IconSystem } from "@/components/icons";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; icon: typeof IconSun }[] = [
  { value: "light", label: "Claro", icon: IconSun },
  { value: "dark", label: "Oscuro", icon: IconMoon },
  { value: "system", label: "Sistema", icon: IconSystem },
];

function applyTheme(theme: Theme) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setTheme(stored === "light" || stored === "dark" ? stored : "system");
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
    <div className="flex gap-1.5 rounded-2xl border border-border bg-surface p-1.5 shadow-sm shadow-black/[0.03]">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => select(value)}
          aria-pressed={theme === value}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            theme === value
              ? "bg-accent text-accent-on"
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
