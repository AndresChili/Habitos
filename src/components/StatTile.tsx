const GRADIENTS = {
  teal: "from-accent to-accent-2",
  violet: "from-violet to-violet-2",
} as const;

export default function StatTile({
  label,
  value,
  hint,
  accent = "teal",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: keyof typeof GRADIENTS;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-faint">{label}</p>
      <p className={`mt-1.5 bg-gradient-to-br ${GRADIENTS[accent]} bg-clip-text text-2xl font-bold tracking-tight text-transparent`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-text-faint">{hint}</p>}
    </div>
  );
}
