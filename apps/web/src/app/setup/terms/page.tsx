import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { AcademicTermManager } from "@/components/setup/academic-term-manager";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

const apiClient = new SchedulerApiClient();
export const metadata: Metadata = { title: "Academic terms" };

export default async function AcademicTermsPage() {
  const terms = await apiClient.listAcademicTerms().catch(() => []);

  return (
    <AppShell
      eyebrow="Setup / Academic terms"
      title="Keep each timetable in its academic context"
      description="Create terms, set the current planning scope, and keep past course sessions and saved schedules organized for reference."
    >
      <AcademicTermManager initialTerms={terms} />
    </AppShell>
  );
}
