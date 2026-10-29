interface ConflictListProps {
  conflicts: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
}

const severityClasses = {
  low: "border-[#bdd9e6] bg-[#edf7fb] text-[#245366]",
  medium: "border-[#e4d4a8] bg-[#fff8e6] text-[#624d1e]",
  high: "border-[#e7c4c6] bg-[#fff1f1] text-[#742b35]",
};

export function ConflictList({ conflicts }: ConflictListProps) {
  return (
    <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
      <h2 className="text-2xl font-semibold text-stone-50">Conflict review queue</h2>
      <div className="mt-5 grid gap-4">
        {conflicts.length === 0 ? (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            No scheduling conflicts were found in the current term.
          </p>
        ) : null}
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
