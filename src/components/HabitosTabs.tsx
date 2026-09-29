import Link from "next/link";

export default function HabitosTabs({ active }: { active: "gestionar" | "estadisticas" }) {
  const tabClass = (tab: "gestionar" | "estadisticas") =>
    `flex-1 rounded-lg py-2 text-center text-sm font-medium transition-all ${
      active === tab ? "bg-surface text-text shadow-sm shadow-black/[0.04]" : "text-text-muted"
    }`;

  return (
    <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
      <Link href="/habitos" className={tabClass("gestionar")}>
        Gestionar
      </Link>
      <Link href="/habitos/estadisticas" className={tabClass("estadisticas")}>
        Estadísticas
      </Link>
    </div>
  );
}
