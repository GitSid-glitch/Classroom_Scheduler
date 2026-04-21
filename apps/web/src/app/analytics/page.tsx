import { ExportAnalyticsButton } from "@/components/analytics/export-analytics-button";
import { AppShell } from "@/components/layout/app-shell";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

const apiClient = new SchedulerApiClient();

export default async function AnalyticsPage() {
  let analytics = {
    room_utilization: [] as Array<{
      room_id: number;
      room_name: string;
      scheduled_minutes: number;
      utilization_score: number;
    }>,
    teacher_load: [] as Array<{
      teacher: string;
      scheduled_sessions: number;
      scheduled_minutes: number;
    }>,
    quality: {
      coverage_ratio: 0,
      value_capture_ratio: 0,
      scheduled_count: 0,
      unscheduled_count: 0,
    },
  };

  try {
    analytics = await apiClient.getAnalytics();
  } catch {
    // Keep the fallback analytics state.
  }

  return (
    <AppShell
      eyebrow="Analytics"
      title="Operational metrics for timetable quality"
      description="This is where the project starts to look like a real academic operations product: measurable coverage, room utilization, and faculty load instead of just a generated schedule."
      actions={<ExportAnalyticsButton analytics={analytics} />}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
          <p className="text-sm text-stone-400">Coverage Ratio</p>
          <p className="mt-3 text-3xl font-semibold text-stone-50">
            {analytics.quality.coverage_ratio}%
          </p>
          <p className="mt-2 text-sm text-stone-300">Share of sessions successfully scheduled.</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
          <p className="text-sm text-stone-400">Value Capture</p>
          <p className="mt-3 text-3xl font-semibold text-stone-50">
            {analytics.quality.value_capture_ratio}%
          </p>
          <p className="mt-2 text-sm text-stone-300">Academic priority captured by the draft.</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
          <p className="text-sm text-stone-400">Scheduled Sessions</p>
          <p className="mt-3 text-3xl font-semibold text-stone-50">
            {analytics.quality.scheduled_count}
          </p>
          <p className="mt-2 text-sm text-stone-300">Sessions placed into compatible rooms.</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
          <p className="text-sm text-stone-400">Unscheduled Sessions</p>
          <p className="mt-3 text-3xl font-semibold text-stone-50">
            {analytics.quality.unscheduled_count}
          </p>
          <p className="mt-2 text-sm text-stone-300">Sessions needing follow-up or re-planning.</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
          <h2 className="text-2xl font-semibold text-stone-50">Room utilization</h2>
          <div className="mt-5 grid gap-3">
            {analytics.room_utilization.map((room) => (
              <div
                key={room.room_id}
                className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-stone-50">{room.room_name}</p>
                  <span className="text-sm text-emerald-300">{room.utilization_score}%</span>
                </div>
                <p className="mt-2 text-sm text-stone-300">
                  Scheduled minutes: {room.scheduled_minutes}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
          <h2 className="text-2xl font-semibold text-stone-50">Teacher load</h2>
          <div className="mt-5 grid gap-3">
            {analytics.teacher_load.map((teacher) => (
              <div
                key={teacher.teacher}
                className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-stone-50">{teacher.teacher}</p>
                  <span className="text-sm text-sky-300">
                    {teacher.scheduled_sessions} sessions
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-300">
                  Scheduled minutes: {teacher.scheduled_minutes}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
