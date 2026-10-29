import Link from "next/link";

import { PublishedTimetableBrowser } from "@/components/scheduler/published-timetable-browser";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { getCurrentIdentity } from "@/lib/auth/server-session";
import { AcademicRepository } from "@/lib/repositories/academic-repository";
import type { CourseOffering, Room } from "@/types/domain";

const apiClient = new SchedulerApiClient();
const repository = new AcademicRepository();

export async function ConsumerTimetablePortal({
  scope,
  roleLabel,
}: {
  scope: "section" | "teacher";
  roleLabel: "Student" | "Faculty";
}) {
  const [roomsResult, offeringsResult, schedulesResult] = await Promise.allSettled([
    repository.getRooms(),
    repository.getCourseOfferings(),
    apiClient.listSchedules(),
  ]);
  const identity = await getCurrentIdentity().catch(() => null);
  if (schedulesResult.status === "rejected") {
    return (
      <section role="status" className="card-surface p-5">
        <h2 className="text-base font-semibold text-stone-50">Published timetable unavailable</h2>
        <p className="mt-1 text-sm text-stone-400">The scheduling service could not be reached. Refresh once it is available again.</p>
      </section>
    );
  }

  const schedules = schedulesResult.value.filter((schedule) => schedule.status === "PUBLISHED");
  const classIds = new Set(schedules.flatMap((schedule) => schedule.assignments.map((item) => String(item.class_session))));
  const roomIds = new Set(schedules.flatMap((schedule) => schedule.assignments.map((item) => String(item.room))));
  const offerings = (offeringsResult.status === "fulfilled" ? offeringsResult.value : [])
    .filter((item: CourseOffering) => classIds.has(item.id));
  const rooms = (roomsResult.status === "fulfilled" ? roomsResult.value : [])
    .filter((item: Room) => roomIds.has(item.id));

  return (
    <>
      <section className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#17665b]">Published only</p>
          <h2 className="mt-1 text-lg font-semibold text-stone-50">Your {roleLabel.toLowerCase()} timetable view</h2>
          <p className="mt-1 text-sm text-stone-400">{identity?.[scope === "section" ? "assignedSection" : "assignedTeacher"]
            ? `Showing ${identity[scope === "section" ? "assignedSection" : "assignedTeacher"]}. Change the filter to browse another published view.`
            : `Filter released schedules by ${scope === "section" ? "section" : "faculty name"}. Drafts and approval notes stay private to coordinators.`}</p>
        </div>
        <Link href="/published-timetable" className="btn-secondary inline-flex rounded-lg px-4 py-2.5 text-xs font-semibold">Open full timetable browser</Link>
      </section>
      {schedules.length ? (
        <PublishedTimetableBrowser
          schedules={schedules}
          offerings={offerings}
          rooms={rooms}
          initialScope={scope}
          initialQuery={identity?.[scope === "section" ? "assignedSection" : "assignedTeacher"] ?? ""}
        />
      ) : (
        <section className="card-surface p-5 text-sm text-stone-400">No published timetable is available yet. Once an administrator releases a schedule, it will appear here.</section>
      )}
    </>
  );
}
