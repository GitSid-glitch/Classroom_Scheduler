import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ConsumerTimetablePortal } from "@/components/scheduler/consumer-timetable-portal";

export const metadata: Metadata = { title: "Faculty portal" };

export default function FacultyPortalPage() {
  return (
    <AppShell
      eyebrow="Faculty Portal"
      title="Teaching schedule at a glance"
      description="Find your released sessions by faculty name, with day, time, section, and room details in one timetable."
    >
      <ConsumerTimetablePortal scope="teacher" roleLabel="Faculty" />
    </AppShell>
  );
}
