import Link from "next/link";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { PublishedTimetableBrowser } from "@/components/scheduler/published-timetable-browser";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { AcademicRepository } from "@/lib/repositories/academic-repository";

const apiClient = new SchedulerApiClient();
export const metadata: Metadata = { title: "Published timetable" };
const repository = new AcademicRepository();

export default async function PublishedTimetablePage() {
  const [roomsResult, offeringsResult, schedulesResult] = await Promise.allSettled([
    repository.getRooms(),
    repository.getCourseOfferings(),
    apiClient.listSchedules(),
  ]);
  const allRooms = roomsResult.status === "fulfilled" ? roomsResult.value : [];
  const allOfferings = offeringsResult.status === "fulfilled" ? offeringsResult.value : [];
  const schedules = schedulesResult.status === "fulfilled" ? schedulesResult.value : [];
  const publishedSchedules = schedules.filter((schedule) => schedule.status === "PUBLISHED");
  const publishedClassIds = new Set(
    publishedSchedules.flatMap((schedule) => schedule.assignments.map((assignment) => String(assignment.class_session))),
  );
  const publishedRoomIds = new Set(
    publishedSchedules.flatMap((schedule) => schedule.assignments.map((assignment) => String(assignment.room))),
  );
  const offerings = allOfferings.filter((offering) => publishedClassIds.has(offering.id));
  const rooms = allRooms.filter((room) => publishedRoomIds.has(room.id));

  return (
    <AppShell
      eyebrow="Published Timetable"
      title="Released schedules for faculty and students"
      description="This page represents the consumption side of the workflow: after review and publication, schedules become a read-only reference artifact for the institution."
    >
      {schedulesResult.status === "rejected" ? (
        <section role="status" className="card-surface p-5">
          <h2 className="text-base font-semibold text-stone-50">The published timetable could not be loaded</h2>
          <p className="mt-1 text-sm text-stone-500">The scheduling service may be offline. Reconnect it, then reload this page.</p>
          <a href="/published-timetable" className="btn-primary mt-4 inline-flex rounded-lg px-4 py-2.5 text-xs font-semibold">Reload timetable</a>
        </section>
      ) : publishedSchedules.length === 0 ? (
        <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
          <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4 text-sm text-stone-300">
            No schedule has been published yet. Generate a draft from the scheduler and publish it
            from the dashboard release manager.
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/scheduler/run"
              className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
            >
              Generate draft schedule
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-stone-500 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
            >
              Open release manager
            </Link>
          </div>
        </section>
      ) : (
        <PublishedTimetableBrowser
          schedules={publishedSchedules}
          offerings={offerings}
          rooms={rooms}
        />
      )}
    </AppShell>
  );
}
