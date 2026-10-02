"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGym, IconHabits, IconToday, IconUser, IconWeight } from "@/components/icons";

const links = [
  { href: "/", label: "Hoy", icon: IconToday },
  { href: "/habitos", label: "Hábitos", icon: IconHabits },
  { href: "/peso", label: "Peso", icon: IconWeight },
  { href: "/gimnasio", label: "Gimnasio", icon: IconGym },
  { href: "/cuenta", label: "Cuenta", icon: IconUser },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-2"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-0.5 rounded-2xl border border-border bg-surface/90 p-1.5 shadow-float backdrop-blur-md">
        {links.map((link) => {
          const active = pathname === link.href || (link.href === "/habitos" && pathname.startsWith("/habitos"));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-medium transition-all active:scale-95 ${
                active
                  ? "bg-gradient-to-br from-accent to-accent-2 text-accent-on shadow-glow"
                  : "text-text-faint hover:text-text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
