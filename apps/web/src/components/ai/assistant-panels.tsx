import type { ScheduleExplanation } from "@/types/domain";

interface AssistantPanelsProps {
  source?: "rules" | "llm";
  model?: string;
  suggestion: {
    title: string;
    suggestion: string;
  };
  explanation: {
    subject: string;
    explanation: string;
    action_hint: string;
  } | null;
  explanations: ScheduleExplanation[];
}

const prompts = [
  "Why was Machine Learning Lab left unscheduled on Tuesday?",
  "Which room change would reduce the most conflicts this week?",
  "Summarize overloaded teachers and suggest a fairer distribution.",
];

export function AssistantPanels({
  source,
  model,
  suggestion,
  explanation,
  explanations,
}: AssistantPanelsProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">
          AI Queries
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-stone-50">
          Product-grade prompts recruiters can imagine real users asking
        </h2>
        <div className="mt-5 grid gap-3">
          {prompts.map((prompt) => (
            <div
              key={prompt}
              className="rounded-[1.25rem] border border-stone-700 bg-stone-950/80 px-4 py-4 text-sm leading-7 text-stone-200"
            >
              {prompt}
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
          Live Assistant Output
        </p>
        <div className="mt-3 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
          {source === "llm" ? `Model-backed${model ? ` • ${model}` : ""}` : "Rule-backed fallback"}
        </div>
        <div className="mt-5 grid gap-4">
          <div className="rounded-[1.25rem] border border-emerald-300/15 bg-emerald-400/10 px-4 py-4 text-sm leading-7 text-emerald-50">
            <p className="font-semibold text-emerald-100">{suggestion.title}</p>
            <p className="mt-2">{suggestion.suggestion}</p>
          </div>
          {explanation ? (
            <div className="rounded-[1.25rem] border border-sky-300/15 bg-sky-300/10 px-4 py-4 text-sm leading-7 text-sky-50">
              <p className="font-semibold text-sky-100">{explanation.subject}</p>
              <p className="mt-2">{explanation.explanation}</p>
              <p className="mt-2 text-sky-100/85">{explanation.action_hint}</p>
            </div>
          ) : null}
          {explanations.slice(0, 3).map((item, index) => (
            <div
              key={`${item.type}-${index}`}
              className="rounded-[1.25rem] border border-stone-700 bg-stone-900 px-4 py-4 text-sm leading-7 text-stone-200"
            >
              <p className="font-semibold uppercase tracking-[0.2em] text-stone-400">
                {item.type.replaceAll("_", " ")}
              </p>
              <p className="mt-2">{item.message}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
