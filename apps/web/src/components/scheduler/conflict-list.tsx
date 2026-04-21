interface ConflictListProps {
  conflicts: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
}

const severityClasses = {
  low: "border-sky-300/20 bg-sky-300/10 text-sky-100",
  medium: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  high: "border-rose-400/20 bg-rose-400/10 text-rose-100",
};

export function ConflictList({ conflicts }: ConflictListProps) {
  return (
    <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
      <h2 className="text-2xl font-semibold text-stone-50">Conflict review queue</h2>
      <div className="mt-5 grid gap-4">
        {conflicts.map((conflict) => (
          <article
            key={conflict.title}
            className={`rounded-[1.5rem] border p-5 ${severityClasses[conflict.severity]}`}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{conflict.title}</h3>
              <span className="rounded-full border border-current/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                {conflict.severity}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-inherit/85">{conflict.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
