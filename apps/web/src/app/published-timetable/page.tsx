import { AppShell } from "@/components/layout/app-shell";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

const apiClient = new SchedulerApiClient();

export default async function PublishedTimetablePage() {
  let publishedSchedules: Awaited<ReturnType<SchedulerApiClient["listSchedules"]>> = [];

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
      <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
        <h2 className="text-2xl font-semibold text-stone-50">Published schedules</h2>
        <div className="mt-5 grid gap-3">
          {publishedSchedules.length === 0 ? (
            <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4 text-sm text-stone-300">
              No schedule has been published yet. Publish one from the dashboard release manager.
            </div>
          ) : null}

          {publishedSchedules.map((schedule) => (
            <article
              key={schedule.id}
              className="rounded-[1.25rem] border border-emerald-300/20 bg-emerald-400/10 p-5"
            >
              <h3 className="text-lg font-semibold text-white">{schedule.name}</h3>
              <p className="mt-2 text-sm text-emerald-100">
                Published at: {schedule.published_at ?? "Recently published"}
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">
                Scheduled classes: {schedule.scheduled_class_ids.length} • Rooms used:{" "}
                {schedule.min_rooms} • Value: {schedule.max_value}
              </p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
