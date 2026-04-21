import Link from "next/link";

import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { DashboardService } from "@/lib/services/dashboard-service";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

const dashboardService = new DashboardService();
const apiClient = new SchedulerApiClient();

export default async function DashboardPage() {
  const snapshot = dashboardService.getSnapshot();
  let publishedCount = 0;
  let draftCount = 0;

  try {
    const schedules = await apiClient.listSchedules();
    publishedCount = schedules.filter((schedule) => schedule.status === "PUBLISHED").length;
    draftCount = schedules.filter((schedule) => schedule.status === "DRAFT").length;
  } catch {
    publishedCount = 0;
    draftCount = 0;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
            Smart Academic Scheduler
          </p>
          <h1 className="font-serif text-4xl text-stone-50 sm:text-5xl">
            Coordinator dashboard for draft timetables and operational review
          </h1>
          <p className="max-w-3xl text-base leading-8 text-stone-300">
            This is the direction that makes the project feel production-minded: visible
            metrics, conflict awareness, explainable decisions, and room for AI assistance.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-stone-500 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
          >
            Back to Overview
          </Link>
          <button className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200">
            Run Draft Schedule
          </button>
        </div>
      </section>

      <MetricsGrid metrics={snapshot.metrics} />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
            Workflow State
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-50">Publishing readiness</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-stone-700 bg-stone-950/80 p-5">
              <p className="text-sm text-stone-400">Draft schedules</p>
              <p className="mt-2 text-3xl font-semibold text-stone-50">{draftCount}</p>
            </div>
            <div className="rounded-[1.25rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
              <p className="text-sm text-emerald-100">Published schedules</p>
              <p className="mt-2 text-3xl font-semibold text-white">{publishedCount}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">
            Role Framing
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-50">
            Designed for academic operations teams
          </h2>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4 text-sm leading-7 text-stone-200">
              Admins configure rooms, faculty constraints, and publish final schedules.
            </div>
            <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4 text-sm leading-7 text-stone-200">
              Coordinators review conflicts, compare drafts, and inspect timetable quality.
            </div>
            <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4 text-sm leading-7 text-stone-200">
              Faculty and students consume the published output rather than editing the plan.
            </div>
          </div>
        </article>
      </section>

      <InsightsPanel insights={snapshot.insights} />
    </main>
  );
}
