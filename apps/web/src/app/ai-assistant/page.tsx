import { AppShell } from "@/components/layout/app-shell";
import { AssistantPanels } from "@/components/ai/assistant-panels";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { AcademicRepository } from "@/lib/repositories/academic-repository";
import type { ScheduleExplanation } from "@/types/domain";

const apiClient = new SchedulerApiClient();
const repository = new AcademicRepository();

export default async function AiAssistantPage() {
  let explanationCount = 0;
  let suggestion = {
    title: "Assistant unavailable",
    suggestion: "Backend assistant data is not reachable yet, so this page is showing fallback content.",
  };
  let explanation: {
    subject: string;
    explanation: string;
    action_hint: string;
  } | null = null;
  let explanations: ScheduleExplanation[] = [];

  try {
    const offerings = await repository.getCourseOfferings();
    const firstOfferingId = offerings[0]?.id;
    const assistant = await apiClient.getAssistantInsights(firstOfferingId);
    explanationCount = assistant.explanations.length;
    suggestion = assistant.suggestion;
    explanation = assistant.explanation
      ? {
          subject: assistant.explanation.subject,
          explanation: assistant.explanation.explanation,
          action_hint: assistant.explanation.action_hint,
        }
      : null;
    explanations = assistant.explanations;
  } catch {
    explanationCount = 0;
  }

  return (
    <AppShell
      eyebrow="AI Assistant"
      title="AI-assisted scheduling operations"
      description="This is the part that aligns the product most strongly with Galaxy AI: structured scheduling data feeding real explanations, suggestions, and import assistance."
      actions={
        <button className="rounded-full bg-sky-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-sky-200">
          Prototype AI suggestions
        </button>
      }
    >
      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <h2 className="text-2xl font-semibold text-stone-50">Structured reasoning inventory</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">
          The backend now emits explanation objects that an AI workflow can consume directly
          instead of reverse-engineering decisions from raw assignments.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-semibold text-sky-100">
          Current explanation objects available from schedule runs: {explanationCount}
        </div>
      </section>
      <AssistantPanels
        suggestion={suggestion}
        explanation={explanation}
        explanations={explanations}
      />
    </AppShell>
  );
}
