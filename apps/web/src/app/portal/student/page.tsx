import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ConsumerTimetablePortal } from "@/components/scheduler/consumer-timetable-portal";

export const metadata: Metadata = { title: "Student portal" };

export default function StudentPortalPage() {
  return (
    <AppShell
      eyebrow="Student Portal"
      title="Your academic week, in one view"
      description="See released classes, rooms, and faculty details. Use the section filter to focus the timetable on your cohort."
    >
      <ConsumerTimetablePortal scope="section" roleLabel="Student" />
    </AppShell>
  );
}
