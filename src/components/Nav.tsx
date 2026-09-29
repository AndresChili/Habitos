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
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {links.map((link) => {
          const active = pathname === link.href || (link.href === "/habitos" && pathname.startsWith("/habitos"));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-[11px] font-medium transition ${
                active ? "text-accent" : "text-text-faint hover:text-text-muted"
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
            className="flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-[11px] font-medium text-text-faint transition hover:text-text-muted"
          >
            <IconLogout className="h-5 w-5" />
            Salir
          </button>
        </form>
      </div>
    </nav>
  );
}
