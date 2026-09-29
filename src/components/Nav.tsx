"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";

const links = [
  { href: "/", label: "Hoy" },
  { href: "/habitos", label: "Hábitos" },
  { href: "/peso", label: "Peso" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                active
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm text-neutral-400 transition hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Salir
          </button>
        </form>
      </div>
    </nav>
  );
}
