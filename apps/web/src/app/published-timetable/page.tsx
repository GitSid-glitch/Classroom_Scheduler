import { AppShell } from "@/components/layout/app-shell";
import { PublishedTimetableBrowser } from "@/components/scheduler/published-timetable-browser";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { AcademicRepository } from "@/lib/repositories/academic-repository";

const apiClient = new SchedulerApiClient();
const repository = new AcademicRepository();

export default async function PublishedTimetablePage() {
  let publishedSchedules: Awaited<ReturnType<SchedulerApiClient["listSchedules"]>> = [];
  const [rooms, offerings] = await Promise.all([
    repository.getRooms(),
    repository.getCourseOfferings(),
  ]);

  try {
    const schedules = await apiClient.listSchedules();
    publishedSchedules = schedules.filter((schedule) => schedule.status === "PUBLISHED");
  } catch {
    publishedSchedules = [];
  }

  return (
    <AppShell
      eyebrow="Published Timetable"
      title="Released schedules for faculty and students"
      description="This page represents the consumption side of the workflow: after review and publication, schedules become a read-only reference artifact for the institution."
    >
      {publishedSchedules.length === 0 ? (
        <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
          <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4 text-sm text-stone-300">
            No schedule has been published yet. Publish one from the dashboard release manager.
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
