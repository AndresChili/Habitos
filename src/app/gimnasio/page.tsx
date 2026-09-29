import { IconGym } from "@/components/icons";

export default function GimnasioPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Gimnasio</h1>
        <p className="text-sm text-text-muted">Ejercicios y rutinas de entrenamiento.</p>
      </header>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <IconGym className="h-6 w-6" />
        </span>
        <p className="text-sm text-text-muted">Todavía no hay nada aquí.</p>
        <p className="max-w-[22rem] text-xs text-text-faint">
          Próximamente: crear tus propios ejercicios y rutinas, con series, repeticiones, días y peso utilizado.
        </p>
      </div>
    </div>
  );
}
