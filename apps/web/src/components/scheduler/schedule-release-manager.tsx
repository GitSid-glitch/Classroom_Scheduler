"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import type { AppRole } from "@/lib/auth/access";
import { ScheduleAssignmentEditor } from "@/components/scheduler/schedule-assignment-editor";
import type { Room } from "@/types/domain";

type ScheduleSummary = Awaited<
  ReturnType<SchedulerApiClient["listSchedules"]>
>[number];

const apiClient = new SchedulerApiClient();

interface ScheduleReleaseManagerProps {
  initialSchedules: ScheduleSummary[];
  available: boolean;
  role: AppRole;
  rooms: Room[];
}

export function ScheduleReleaseManager({
  initialSchedules,
  available,
  role,
  rooms,
}: ScheduleReleaseManagerProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [baselineId, setBaselineId] = useState(String(initialSchedules[1]?.id ?? ""));
  const [comparisonId, setComparisonId] = useState(String(initialSchedules[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const baseline = schedules.find((schedule) => String(schedule.id) === baselineId);
  const comparison = schedules.find((schedule) => String(schedule.id) === comparisonId);
  const changes = useMemo(() => {
    if (!baseline || !comparison || baseline.id === comparison.id) return [];
    const before = new Map(baseline.assignments.map((item) => [item.class_session, item]));
    const after = new Map(comparison.assignments.map((item) => [item.class_session, item]));
    const classIds = new Set([...before.keys(), ...after.keys()]);

    return [...classIds].flatMap((classId) => {
      const oldItem = before.get(classId);
      const newItem = after.get(classId);
      const label = newItem?.subject_snapshot || oldItem?.subject_snapshot || `Session ${classId}`;
      const placement = (item: NonNullable<typeof oldItem>) =>
        `${item.day_of_week_snapshot} ${item.start_time_snapshot?.slice(0, 5)}–${item.end_time_snapshot?.slice(0, 5)} · ${item.room_name_snapshot}`;

      if (!oldItem && newItem) return [{ id: classId, label, kind: "Added", detail: placement(newItem) }];
      if (oldItem && !newItem) return [{ id: classId, label, kind: "Removed", detail: placement(oldItem) }];
      if (!oldItem || !newItem) return [];

      const unchanged =
        oldItem.subject_snapshot === newItem.subject_snapshot &&
        oldItem.teacher_snapshot === newItem.teacher_snapshot &&
        oldItem.batch_snapshot === newItem.batch_snapshot &&
        oldItem.day_of_week_snapshot === newItem.day_of_week_snapshot &&
        oldItem.start_time_snapshot === newItem.start_time_snapshot &&
        oldItem.end_time_snapshot === newItem.end_time_snapshot &&
        oldItem.room_name_snapshot === newItem.room_name_snapshot;
      return unchanged
        ? []
        : [{ id: classId, label, kind: "Changed", detail: `${placement(oldItem)} → ${placement(newItem)}` }];
    });
  }, [baseline, comparison]);

  function handleAction(action: (scheduleId: number) => Promise<ScheduleSummary>, schedule: ScheduleSummary) {
    setError(null);

    startTransition(async () => {
      try {
        await action(schedule.id);
        setSchedules(await apiClient.listSchedules());
      } catch (actionError) {
        setError(
          actionError instanceof Error ? actionError.message : "Failed to update schedule status.",
        );
      }
    });
  }

  const isAdmin = role === "ADMIN";
  const statusLabels: Record<ScheduleSummary["status"], string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending approval",
    APPROVED: "Approved",
    REJECTED: "Changes requested",
    PUBLISHED: "Published",
    SUPERSEDED: "Previous release",
  };

  return (
    <section className="card-surface rounded-[1.75rem] p-6" aria-busy={isPending}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#17665b]">
            Release Workflow
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#243a34]">
            Review and release schedules
          </h2>
          <p className="mt-1 text-sm text-stone-500">Drafts move through approval before a release becomes visible to faculty and students.</p>
        </div>
        <Link
          href="/published-timetable"
          className="inline-flex items-center justify-center rounded-full border border-[#dce6e1] px-5 py-3 text-sm font-semibold text-[#243a34] transition hover:bg-[#f4faf7]"
        >
          Open published timetable
        </Link>
      </div>

      {error ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p> : null}

      {schedules.length > 1 ? (
        <div className="mt-6 rounded-[1.25rem] border border-[#e1ebe6] bg-[#f8fbf9] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="grid flex-1 gap-2 text-xs font-medium text-stone-600">
              Baseline run
              <select className="field-control px-3 py-2 text-sm" value={baselineId} onChange={(event) => setBaselineId(event.target.value)}>
                <option value="">Choose a saved run</option>
                {schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.name} · {new Date(schedule.created_at).toLocaleString()}</option>)}
              </select>
            </label>
            <label className="grid flex-1 gap-2 text-xs font-medium text-stone-600">
              Compare with
              <select className="field-control px-3 py-2 text-sm" value={comparisonId} onChange={(event) => setComparisonId(event.target.value)}>
                <option value="">Choose a saved run</option>
                {schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.name} · {new Date(schedule.created_at).toLocaleString()}</option>)}
              </select>
            </label>
          </div>
          {baseline && comparison && baseline.id !== comparison.id ? (
            <div className="mt-4 border-t border-stone-700 pt-4">
              <p className="text-xs font-semibold text-[#243a34]">{changes.length} placement changes</p>
              {changes.length === 0 ? <p className="mt-2 text-xs text-stone-400">These saved runs contain the same placements.</p> : (
                <ul className="mt-3 grid gap-2">
                  {changes.slice(0, 12).map((change) => (
                    <li key={change.id} className="flex flex-col gap-1 rounded-lg border border-[#e7efea] bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-semibold text-[#243a34]">{change.label} <span className="ml-1 font-medium text-[#17665b]">{change.kind}</span></span>
                      <span className="text-[11px] text-stone-500">{change.detail}</span>
                    </li>
                  ))}
                  {changes.length > 12 ? <li className="text-xs text-stone-500">+{changes.length - 12} more changes</li> : null}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {schedules.length === 0 ? (
          <div className="rounded-[1.25rem] border border-[#e1ebe6] bg-[#f8fbf9] p-4 text-sm text-stone-600">
            {available ? "No schedules have been generated yet." : "Schedules could not be loaded. Check the API connection and refresh this page."}
          </div>
        ) : null}

        {schedules.map((schedule) => (
          <article
            key={schedule.id}
            className="rounded-[1.25rem] border border-[#e1ebe6] bg-white p-4"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-semibold text-[#243a34]">{schedule.name}</p>
                <p className="mt-1 text-sm text-stone-600">
                  Status: {statusLabels[schedule.status]}
                  {schedule.published_at ? ` • Last released ${new Date(schedule.published_at).toLocaleString()}` : ""}
                </p>
                {schedule.reviewed_by ? <p className="mt-1 text-xs text-stone-500">Reviewed by {schedule.reviewed_by}</p> : null}
                {schedule.approval_note ? <p className="mt-2 max-w-2xl rounded-lg bg-[#fff9ed] px-3 py-2 text-xs text-[#765a2a]">Review note: {schedule.approval_note}</p> : null}
                <p className="mt-2 text-sm text-stone-500">
                  Scheduled classes: {schedule.scheduled_class_ids.length} • Rooms used:{" "}
                  {schedule.min_rooms} • Value: {schedule.max_value}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {schedule.status === "DRAFT" ? <button type="button" onClick={() => handleAction(apiClient.submitScheduleForApproval.bind(apiClient), schedule)} disabled={isPending} className="btn-primary rounded-full px-4 py-2.5 text-xs font-semibold disabled:opacity-60">Submit for approval</button> : null}
                {schedule.status === "REJECTED" ? <button type="button" onClick={() => handleAction(apiClient.reviseSchedule.bind(apiClient), schedule)} disabled={isPending} className="btn-primary rounded-full px-4 py-2.5 text-xs font-semibold disabled:opacity-60">Return to draft</button> : null}
                {schedule.status === "PENDING_APPROVAL" && isAdmin ? <>
                  <button type="button" onClick={() => handleAction((id) => apiClient.approveSchedule(id), schedule)} disabled={isPending} className="btn-primary rounded-full px-4 py-2.5 text-xs font-semibold disabled:opacity-60">Approve</button>
                  <button type="button" onClick={() => handleAction((id) => apiClient.requestScheduleChanges(id, reviewNotes[id] ?? ""), schedule)} disabled={isPending || !(reviewNotes[schedule.id] ?? "").trim()} className="rounded-full border border-[#e5d9bb] px-4 py-2.5 text-xs font-semibold text-[#765a2a] hover:bg-[#fff9ed] disabled:opacity-50">Request changes</button>
                </> : null}
                {schedule.status === "APPROVED" && isAdmin ? <button type="button" onClick={() => handleAction(apiClient.publishSchedule.bind(apiClient), schedule)} disabled={isPending} className="btn-primary rounded-full px-4 py-2.5 text-xs font-semibold disabled:opacity-60">Publish release</button> : null}
                {schedule.status === "PUBLISHED" && isAdmin ? <button type="button" onClick={() => handleAction(apiClient.unpublishSchedule.bind(apiClient), schedule)} disabled={isPending} className="rounded-full border border-[#dce6e1] px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60">Unpublish</button> : null}
                {schedule.status === "SUPERSEDED" && isAdmin ? <button type="button" onClick={() => handleAction(apiClient.restoreSchedule.bind(apiClient), schedule)} disabled={isPending} className="rounded-full border border-[#dce6e1] px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60">Restore release</button> : null}
                <a
                  href={apiClient.getScheduleExportUrl(schedule.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#dce6e1] px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >Export CSV</a>
              </div>
            </div>
            {schedule.status === "PENDING_APPROVAL" && isAdmin ? <label className="mt-3 block max-w-2xl text-xs font-medium text-stone-600">Reviewer note <textarea className="field-control mt-1 min-h-16 w-full px-3 py-2 text-sm" value={reviewNotes[schedule.id] ?? ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [schedule.id]: event.target.value }))} placeholder="Explain the changes needed before release" /></label> : null}
            {schedule.status === "DRAFT" ? (
              <div className="mt-4">
                <ScheduleAssignmentEditor
                  scheduleId={schedule.id}
                  assignments={schedule.assignments}
                  rooms={rooms}
                  onSaved={(updated) => setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item))}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
