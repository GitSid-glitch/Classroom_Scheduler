import { AppShell } from "@/components/layout/app-shell";
import { ConflictList } from "@/components/scheduler/conflict-list";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

const apiClient = new SchedulerApiClient();

export default async function SchedulerConflictsPage() {
  let conflicts: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }> = [
    {
      title: "Conflict analysis unavailable",
      description:
        "The backend analyze endpoint could not be reached, so the page is showing a graceful fallback state.",
      severity: "low",
    },
  ];

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
    // Fall back to the static informational state above.
  }

  return (
    <AppShell
      eyebrow="Scheduler / Conflicts"
      title="Conflict center for coordinators"
      description="This route is what moves the project from a demo into an operational tool. Schools need to see what failed, why it failed, and what can be fixed next."
    >
      <ConflictList conflicts={conflicts} />
    </AppShell>
  );
}
