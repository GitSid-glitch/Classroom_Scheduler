import type { SchedulingMetric } from "@/types/domain";

interface MetricsGridProps {
  metrics: SchedulingMetric[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-[1.5rem] border border-stone-800 bg-stone-950 p-5"
        >
          <p className="text-sm text-stone-400">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold text-stone-50">{metric.value}</p>
          <p className="mt-2 text-sm text-emerald-300">{metric.change}</p>
        </article>
      ))}
    </div>
  );
}
