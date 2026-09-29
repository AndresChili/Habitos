"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { IconHabits, IconLogout, IconToday, IconWeight } from "@/components/icons";

const links = [
  { href: "/", label: "Hoy", icon: IconToday },
  { href: "/habitos", label: "Hábitos", icon: IconHabits },
  { href: "/peso", label: "Peso", icon: IconWeight },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-surface/90 p-1.5 shadow-lg shadow-black/[0.06] backdrop-blur-md">
        {links.map((link) => {
          const active = pathname === link.href || (link.href === "/habitos" && pathname.startsWith("/habitos"));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-[11px] font-medium transition-all active:scale-95 ${
                active ? "bg-accent-soft text-accent-strong" : "text-text-faint hover:text-text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-[11px] font-medium text-text-faint transition-all active:scale-95 hover:text-text-muted"
          >
            <IconLogout className="h-5 w-5" />
            Salir
          </button>
        </form>
      </div>
    </nav>
  );
}
