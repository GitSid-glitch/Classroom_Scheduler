import { ScheduleExplanationService } from "@/lib/services/schedule-explanation-service";

const explanationService = new ScheduleExplanationService();

export function HighlightCards() {
  const highlights = explanationService.buildHighlights();

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {highlights.map((highlight) => (
        <article
          key={highlight.heading}
          className="rounded-[1.75rem] border border-white/10 bg-stone-950/70 p-6"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">
            Why this matters
          </p>
          <h3 className="mt-4 text-xl font-semibold text-stone-50">{highlight.heading}</h3>
          <p className="mt-3 text-sm leading-7 text-stone-300">{highlight.body}</p>
        </article>
      ))}
    </section>
  );
}
