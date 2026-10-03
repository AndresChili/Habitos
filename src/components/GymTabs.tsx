import Link from "next/link";

type Tab = "rutinas" | "ejercicios" | "calendario" | "records";

export default function GymTabs({ active }: { active: Tab }) {
  const tabClass = (tab: Tab) =>
    `flex-1 rounded-lg py-2 text-center text-sm font-medium transition-all ${
      active === tab ? "bg-surface text-text shadow-card" : "text-text-muted"
    }`;

  return (
    <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
      <Link href="/gimnasio" className={tabClass("rutinas")}>
        Rutinas
      </Link>
      <Link href="/gimnasio/ejercicios" className={tabClass("ejercicios")}>
        Ejercicios
      </Link>
      <Link href="/gimnasio/calendario" className={tabClass("calendario")}>
        Calendario
      </Link>
      <Link href="/gimnasio/records" className={tabClass("records")}>
        Récords
      </Link>
    </div>
  );
}
