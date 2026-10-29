import type { SchedulingInsight } from "@/types/domain";

interface InsightsPanelProps {
  insights: SchedulingInsight[];
  available: boolean;
}

const severityStyles: Record<SchedulingInsight["severity"], string> = {
  low: "border-[#bdd9e6] bg-[#edf7fb] text-[#245366]",
  medium: "border-[#e4d4a8] bg-[#fff8e6] text-[#624d1e]",
  high: "border-[#e7c4c6] bg-[#fff1f1] text-[#742b35]",
};

export function InsightsPanel({ insights, available }: InsightsPanelProps) {
  return (
    <section className="rounded-[2rem] border border-stone-800 bg-stone-950 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-400">
            Review Queue
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-50">
            Operational insights before publishing
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-stone-400">
          Conflicts found in the current room, faculty, and course inputs appear here for review.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {insights.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-stone-700 p-4 text-sm text-stone-400">
            {available
              ? "No input conflicts are currently reported. New conflicts will appear here after constraints change."
              : "Conflict analysis is unavailable. Check the scheduling API connection and try again."}
          </div>
        ) : null}
        {insights.map((insight) => (
          <article
            key={insight.id}
            className={`rounded-[1.5rem] border p-5 ${severityStyles[insight.severity]}`}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{insight.title}</h3>
              <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                {insight.severity}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-inherit/85">{insight.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
