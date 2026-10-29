import type { ScheduleExplanation } from "@/types/domain";

interface AssistantPanelsProps {
  source?: "rules" | "groq";
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
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="card-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#17665b]">
          Questions to explore
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-50">
          Explore the schedule
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Start with a question to focus your next review.
        </p>
        <div className="mt-5 grid gap-3">
          {prompts.map((prompt) => (
            <div
              key={prompt}
              className="rounded-xl border border-[#e8efeb] bg-[#fbfcfb] px-4 py-3.5 text-sm leading-6 text-stone-200"
            >
              <span className="mr-2 text-[#17665b]" aria-hidden="true">↗</span>{prompt}
            </div>
          ))}
        </div>
      </article>

      <article className="card-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#17665b]">
          Scheduling recommendation
        </p>
        <div className="mt-3 inline-flex rounded-full border border-[#dceae4] bg-[#f3f8f5] px-3 py-1 text-[11px] font-semibold text-[#286477]">
          {source === "groq"
            ? `Groq · ${model ?? "GPT-OSS 120B"}`
            : "Rules-based guidance"}
        </div>
        <div className="mt-5 grid gap-4">
          <div className="rounded-xl border border-[#dceae4] bg-[#f5faf7] px-4 py-4 text-sm leading-6 text-stone-200">
            <p className="font-semibold text-stone-50">{suggestion.title}</p>
            <p className="mt-2">{suggestion.suggestion}</p>
          </div>
          {explanation ? (
            <div className="rounded-xl border border-[#e1ebef] bg-[#f6fafb] px-4 py-4 text-sm leading-6 text-stone-200">
              <p className="font-semibold text-stone-50">{explanation.subject}</p>
              <p className="mt-2">{explanation.explanation}</p>
              <p className="mt-2 font-medium text-[#286477]">Next step: {explanation.action_hint}</p>
            </div>
          ) : null}
          {explanations.slice(0, 3).map((item, index) => (
            <div
              key={`${item.type}-${index}`}
              className="rounded-xl border border-[#e8efeb] bg-[#fbfcfb] px-4 py-4 text-sm leading-6 text-stone-200"
            >
              <p className="font-semibold uppercase tracking-[0.12em] text-stone-400">
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
