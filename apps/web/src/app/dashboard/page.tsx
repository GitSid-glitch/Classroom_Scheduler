import Link from "next/link";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { RecentActivityPanel } from "@/components/dashboard/recent-activity-panel";
import { ScheduleReleaseManager } from "@/components/scheduler/schedule-release-manager";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { getCurrentIdentity } from "@/lib/auth/server-session";
import type { AuditEvent, SchedulingMetric, SchedulingInsight } from "@/types/domain";

const apiClient = new SchedulerApiClient();
export const metadata: Metadata = { title: "Scheduling overview" };
type ScheduleListItem = Awaited<ReturnType<SchedulerApiClient["listSchedules"]>>[number];

function resultValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

export default async function DashboardPage() {
  const [identityResult, roomsResult, teachersResult, sectionsResult, offeringsResult, schedulesResult, auditResult, analyticsResult, conflictsResult] =
    await Promise.allSettled([
      getCurrentIdentity(),
      apiClient.getRooms(),
      apiClient.getTeachers(),
      apiClient.getSections(),
      apiClient.getCourseOfferings(),
      apiClient.listSchedules(),
      apiClient.getAuditEvents(),
      apiClient.getAnalytics(),
      apiClient.analyzeScheduleInputs(),
    ]);

  const rooms = resultValue(roomsResult, []);
  const teachers = resultValue(teachersResult, []);
  const sections = resultValue(sectionsResult, []);
  const offerings = resultValue(offeringsResult, []);
  const schedules: ScheduleListItem[] = resultValue(schedulesResult, []);
  const auditEvents: AuditEvent[] = resultValue(auditResult, []).slice(0, 8);
  const analytics = resultValue(analyticsResult, null);
  const conflicts = resultValue(conflictsResult, null)?.conflicts ?? null;
  const identity = resultValue(identityResult, null);
  const apiAvailable = [roomsResult, teachersResult, sectionsResult, offeringsResult].some(
    (result) => result.status === "fulfilled",
  );
  const hasOfferings = offerings.length > 0;
  const noOfferings = offeringsResult.status === "fulfilled" && !hasOfferings;
  const schedulesAvailable = schedulesResult.status === "fulfilled";
  const averageRoomUtilization = analytics?.room_utilization.length
    ? Math.round(
        analytics.room_utilization.reduce((total, room) => total + room.utilization_score, 0) /
          analytics.room_utilization.length,
      )
    : 0;

  const metrics: SchedulingMetric[] = [
    {
      label: "Current coverage preview",
      value: analytics ? `${analytics.quality.coverage_ratio}%` : noOfferings ? "0%" : "—",
      change: analytics
        ? `${analytics.quality.scheduled_count} of ${analytics.quality.scheduled_count + analytics.quality.unscheduled_count} sessions placed`
        : noOfferings
          ? "Add course offerings to calculate"
          : "Live scheduling data unavailable",
    },
    {
      label: "Unscheduled sessions",
      value: analytics ? String(analytics.quality.unscheduled_count) : noOfferings ? "0" : "—",
      change: analytics ? "Based on current room and teacher constraints" : "From the latest scheduling analysis",
    },
    {
      label: "Average room utilization",
      value: analytics ? `${averageRoomUtilization}%` : noOfferings ? "0%" : "—",
      change: analytics ? `Across ${analytics.room_utilization.length} rooms` : "Calculated from placed sessions",
    },
    {
      label: "Open conflicts",
      value: conflicts === null ? "—" : String(conflicts.length),
      change: conflicts === null ? "Conflict analysis unavailable" : "Current input analysis",
    },
  ];

  const insights: SchedulingInsight[] = (conflicts ?? []).map((conflict, index) => ({
    id: `${conflict.type}-${index}`,
    title: conflict.title,
    description: conflict.description,
    severity: conflict.severity,
  }));
  const publishedCount = schedules.filter((schedule) => schedule.status === "PUBLISHED").length;
  const draftCount = schedules.filter((schedule) => schedule.status === "DRAFT").length;
  const pendingApprovalCount = schedules.filter((schedule) => schedule.status === "PENDING_APPROVAL").length;

  return (
    <AppShell
      eyebrow="Overview"
      title="Scheduling overview"
      description="Review live campus readiness, resolve input conflicts, and track schedules from draft to publication."
      actions={
        <Link href="/scheduler/run" className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold">
          Run scheduler <span aria-hidden="true">→</span>
        </Link>
      }
    >
      {!apiAvailable ? (
        <section role="status" className="card-surface flex flex-col gap-3 border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-950">Live workspace data is unavailable</p>
            <p className="mt-1 text-xs text-amber-900">Connect the Django API to load inventory, conflicts, schedules, and activity. Placeholder metrics are hidden.</p>
          </div>
          <Link href="/setup/courses" className="text-xs font-semibold text-[#17665b]">Review setup →</Link>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[#e1ebe6] bg-white px-4 py-3 text-xs text-stone-300 shadow-sm">
        <span className="font-medium text-stone-100">Live workspace</span>
        <span className="hidden h-4 border-l border-[#e1ebe6] sm:block" />
        <span>{schedulesAvailable ? draftCount : "—"} drafts</span>
        <span>{schedulesAvailable ? pendingApprovalCount : "—"} awaiting approval</span>
        <span>{schedulesAvailable ? publishedCount : "—"} published</span>
        <span>{offeringsResult.status === "fulfilled" ? offerings.length : "—"} course offerings</span>
      </div>

      <MetricsGrid metrics={metrics} />

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <article className="card-surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaf0ec] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#17665b]">Schedule health</p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-stone-50">Current workspace readiness</h2>
            </div>
            <Link href="/analytics" className="text-xs font-semibold text-[#17665b]">View insights →</Link>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-[1fr_1fr] sm:items-center">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-[-.05em] text-stone-50">{analytics ? `${analytics.quality.coverage_ratio}%` : "—"}</span>
                <span className="mb-1 text-xs font-medium text-stone-400">current coverage</span>
              </div>
              <p className="mt-1 text-xs text-stone-400">Share of course sessions placeable under the current constraints</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf2ef]" role="progressbar" aria-label="Current schedule coverage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={analytics?.quality.coverage_ratio ?? 0}>
                <div className="h-full rounded-full bg-[#278775] transition-[width]" style={{ width: `${analytics?.quality.coverage_ratio ?? 0}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-stone-400"><span>{analytics?.quality.scheduled_count ?? 0} scheduled sessions</span><span>100%</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/scheduler/conflicts" className="rounded-xl border border-[#f0e2c4] bg-[#fffaf0] p-3 transition hover:border-[#e7d3a9]">
                <p className="text-[10px] font-medium text-[#8a6a32]">Needs review</p>
                <p className="mt-1 text-xl font-semibold text-[#765a2a]">{conflicts?.length ?? "—"}</p>
                <p className="mt-1 text-[10px] text-[#8a6a32]">Open conflicts →</p>
              </Link>
              <Link href="/scheduler/run" className="rounded-xl border border-[#dceae4] bg-[#f4faf7] p-3 transition hover:border-[#bed9ce]">
                <p className="text-[10px] font-medium text-[#527669]">Unscheduled</p>
                <p className="mt-1 text-xl font-semibold text-[#245a4b]">{analytics?.quality.unscheduled_count ?? "—"}</p>
                <p className="mt-1 text-[10px] text-[#527669]">See sessions →</p>
              </Link>
            </div>
          </div>
          <div className="border-t border-[#eaf0ec] bg-[#fbfcfb] px-5 py-3 text-[10px] text-stone-400">{analytics ? "Metrics calculated from current database constraints." : hasOfferings ? "Analytics could not be loaded. Check the scheduling API." : "Add course offerings to calculate schedule coverage."}</div>
        </article>

        <article className="card-surface p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#17665b]">At a glance</p><h2 className="mt-1 text-base font-semibold text-stone-50">Campus inventory</h2></div>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf4f0] text-lg text-[#17665b]" aria-hidden="true">⌂</span>
          </div>
          <div className="mt-4 divide-y divide-[#edf1ee]">
            {[
              ["Teaching spaces", roomsResult.status === "fulfilled" ? rooms.length : "—", "/setup/rooms"],
              ["Faculty members", teachersResult.status === "fulfilled" ? teachers.length : "—", "/setup/teachers"],
              ["Sections", sectionsResult.status === "fulfilled" ? sections.length : "—", "/setup/sections"],
              ["Course offerings", offeringsResult.status === "fulfilled" ? offerings.length : "—", "/setup/courses"],
            ].map(([label, count, href]) => (
              <Link key={label} href={String(href)} className="flex items-center justify-between py-3 text-xs transition hover:text-[#17665b]">
                <span className="text-stone-300">{label}</span><span className="font-semibold text-stone-100">{count}<span className="ml-3 text-stone-400">→</span></span>
              </Link>
            ))}
          </div>
          <Link href="/setup/rooms" className="mt-3 inline-flex text-[11px] font-semibold text-[#17665b]">Manage institution data →</Link>
        </article>
      </section>

      <ScheduleReleaseManager initialSchedules={schedules} available={schedulesAvailable} role={identity?.role ?? "FACULTY"} rooms={rooms} />
      <section className="grid gap-5 xl:grid-cols-2">
        <InsightsPanel insights={insights} available={conflicts !== null} />
        <RecentActivityPanel events={auditEvents} />
      </section>
    </AppShell>
  );
}
