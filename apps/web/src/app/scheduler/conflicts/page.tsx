import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ConflictList } from "@/components/scheduler/conflict-list";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

const apiClient = new SchedulerApiClient();
export const metadata: Metadata = { title: "Conflict center" };

export default async function SchedulerConflictsPage() {
  let available = true;
  let conflicts: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }> = [];

  try {
    const response = await apiClient.analyzeScheduleInputs();
    if (response.conflicts.length > 0) {
      conflicts = response.conflicts.map((conflict) => ({
        title: conflict.title,
        description: conflict.description,
        severity: conflict.severity,
      }));
    }
  } catch {
    available = false;
  }

  return (
    <AppShell
      eyebrow="Scheduler / Conflicts"
      title="Conflict center for coordinators"
      description="This route is what moves the project from a demo into an operational tool. Schools need to see what failed, why it failed, and what can be fixed next."
    >
      {available ? (
        <ConflictList conflicts={conflicts} />
      ) : (
        <section role="status" className="card-surface flex flex-col items-start gap-3 p-5">
          <div>
            <h2 className="text-base font-semibold text-stone-50">Conflict analysis is unavailable</h2>
            <p className="mt-1 text-sm text-stone-500">The scheduling service did not return current results. Reconnect the API, then reload this page.</p>
          </div>
          <a href="/scheduler/conflicts" className="btn-primary rounded-lg px-4 py-2.5 text-xs font-semibold">Reload analysis</a>
        </section>
      )}
    </AppShell>
  );
}
