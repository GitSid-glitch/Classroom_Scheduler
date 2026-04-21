import type { SchedulingInsight } from "@/types/domain";

interface InsightsPanelProps {
  insights: SchedulingInsight[];
}

const severityStyles: Record<SchedulingInsight["severity"], string> = {
  low: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  medium: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  high: "border-rose-400/20 bg-rose-400/10 text-rose-100",
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
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
          These are the kinds of issues a coordinator should see immediately after draft
          generation instead of discovering them in spreadsheets later.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
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
