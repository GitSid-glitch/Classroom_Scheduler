import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { AssistantPanels } from "@/components/ai/assistant-panels";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { AcademicRepository } from "@/lib/repositories/academic-repository";
import type { ScheduleExplanation } from "@/types/domain";

const apiClient = new SchedulerApiClient();
export const metadata: Metadata = { title: "Scheduling assistant" };
const repository = new AcademicRepository();

export default async function AiAssistantPage() {
  let explanationCount = 0;
  let source: "rules" | "groq" | undefined;
  let model: string | undefined;
  let suggestion = {
    title: "Assistant unavailable",
      suggestion: "Review the latest schedule run for evidence-based guidance. Rules-based recommendations remain available if Groq is unavailable.",
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
    source = assistant.source;
    model = assistant.model;
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
      description="Review schedule outcomes with explanations grounded in room fit, faculty availability and timetable conflicts. Groq is optional and advisory, with transparent rules-based guidance if it is unavailable."
      actions={<Link href="/scheduler/run" className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold">Open scheduler <span aria-hidden="true">→</span></Link>}
    >
      <section className="card-surface p-6">
        <h2 className="text-xl font-semibold tracking-tight text-stone-50">Grounded recommendations</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-300">
          Recommendations use the scheduling engine’s structured results. They remain advisory; coordinators decide whether to change the timetable.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-[#dceae4] bg-[#f3f8f5] px-3 py-1.5 text-xs font-medium text-stone-200">
          Current explanation objects available from schedule runs: {explanationCount}
        </div>
      </section>
      <AssistantPanels
        source={source}
        model={model}
        suggestion={suggestion}
        explanation={explanation}
        explanations={explanations}
      />
    </AppShell>
  );
}
