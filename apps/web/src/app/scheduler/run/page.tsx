import Link from "next/link";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { ConflictList } from "@/components/scheduler/conflict-list";
import { ManualOverridePanel } from "@/components/scheduler/manual-override-panel";
import { StatusBoard } from "@/components/scheduler/status-board";
import { RunScheduleButton } from "@/components/scheduler/run-schedule-button";
import {
  WeeklyTimetableGrid,
  type WeeklyTimetableEntry,
} from "@/components/scheduler/weekly-timetable-grid";
import { AcademicRepository } from "@/lib/repositories/academic-repository";
import { SchedulerApiClient, type ScheduleRunResponse } from "@/lib/api/scheduler-api-client";

const repository = new AcademicRepository();
const apiClient = new SchedulerApiClient();
export const metadata: Metadata = { title: "Run scheduler" };

export default async function SchedulerRunPage() {
  const [offerings, rooms] = await Promise.all([
    repository.getCourseOfferings(),
    repository.getRooms(),
  ]);

  if (offerings.length === 0 || rooms.length === 0) {
    return (
      <AppShell
        eyebrow="Scheduler / Run"
        title="Draft generation and review workflow"
        description="The scheduler needs both course offerings and rooms before it can generate a draft."
        actions={
          <>
            <Link
              href="/setup/courses"
              className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
            >
              Open course setup
            </Link>
            <Link
              href="/setup/rooms"
              className="rounded-full border border-stone-500 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
            >
              Open room setup
            </Link>
          </>
        }
      >
        <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
          <div className="rounded-[1.25rem] border border-dashed border-stone-700 p-5 text-sm leading-7 text-stone-300">
            {offerings.length === 0
              ? "No course offerings are available yet. Add or import class sessions first."
              : "No rooms are available yet. Add or import rooms first."}
          </div>
        </section>
      </AppShell>
    );
  }

  let latestSchedule: ScheduleRunResponse | null = null;
  let unscheduledConflicts: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }> = [];
  let explanationCards: Array<{
    title: string;
    description: string;
  }> = [];
  let draftEntries: WeeklyTimetableEntry[] = [];

  let apiUnavailable = false;

  try {
    latestSchedule = (await apiClient.listSchedules())[0] ?? null;
    if (latestSchedule) {
      unscheduledConflicts = latestSchedule.unscheduled.map((item) => ({
        title: `${item.subject} (${item.day_of_week} ${item.start_time}-${item.end_time})`,
        description: item.reason,
        severity:
          item.reason.includes("Teacher") || item.reason.includes("Batch") ? "medium" : "high",
      }));
      explanationCards = latestSchedule.explanations.map((item) => ({
        title: item.type.replaceAll("_", " "),
        description: item.message,
      }));
      draftEntries = latestSchedule.assignments
        .map((assignment) => {
          const offering = offerings.find((item) => item.id === String(assignment.class_session));
          const room = rooms.find((item) => item.id === String(assignment.room));

          if ((!offering && !assignment.subject_snapshot) || (!room && !assignment.room_name_snapshot)) {
            return null;
          }

          return {
            id: String(assignment.id),
            title: assignment.subject_snapshot || offering?.title || "Class session",
            subtitle: `${assignment.batch_snapshot || offering?.sectionName || offering?.sectionId || "Section"} • ${assignment.teacher_snapshot || offering?.teacherName || offering?.teacherId || "Faculty"}`,
            meta: `Room ${assignment.room_name_snapshot || room?.name || "Unassigned"}`,
            dayCode: assignment.day_of_week_snapshot || offering?.dayCode || "MON",
            startTime: assignment.start_time_snapshot || offering?.startTime || "09:00",
            endTime: assignment.end_time_snapshot || offering?.endTime || "10:00",
            roomId: String(assignment.room),
          };
        })
        .filter((entry): entry is WeeklyTimetableEntry => entry !== null);
    }
  } catch {
    apiUnavailable = true;
    unscheduledConflicts = [
      {
        title: "Schedule service unavailable",
        description: "Reconnect the Django API to load saved runs and current conflict analysis.",
        severity: "low",
      },
    ];
    explanationCards = [
      {
        title: "Connect the scheduling API",
        description: "This page reads saved schedules from the database and will not create a draft until you request one.",
      },
    ];
  }

  return (
    <AppShell
      eyebrow="Scheduler / Run"
      title="Generate and review a schedule"
      description="Create a draft when you are ready, then review its room assignments, open conflicts and explanations before publishing."
      actions={
        <>
          <RunScheduleButton />
          <Link
            href="/scheduler/conflicts"
            className="inline-flex items-center rounded-lg border border-stone-700 bg-white px-4 py-2.5 text-xs font-semibold text-stone-200 transition hover:bg-stone-900"
          >
            Review conflicts
          </Link>
        </>
      }
    >
      {latestSchedule ? <StatusBoard
        scheduledCount={latestSchedule.scheduled_class_ids.length}
        totalCount={offerings.length}
        minRooms={latestSchedule.min_rooms}
        maxValue={latestSchedule.max_value}
      /> : <section className="card-surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold text-stone-100">{apiUnavailable ? "Schedule service unavailable" : "No saved draft yet"}</p><p className="mt-1 text-xs text-stone-400">{apiUnavailable ? "Start the Django API to load database schedules." : `${offerings.length} course offerings and ${rooms.length} rooms are ready for a first run.`}</p></div>
        {!apiUnavailable ? <RunScheduleButton /> : null}
      </section>}

      <ManualOverridePanel initialOfferings={offerings} rooms={rooms} />

      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
              Schedule lifecycle
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-50">
              Latest schedule: {latestSchedule?.status ?? "None yet"}
            </h2>
          </div>
          <div className="inline-flex rounded-full border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-100">
            Draft → review → admin approval → release
          </div>
        </div>
        {latestSchedule?.status === "DRAFT" ? (
          <p className="mt-4 text-sm leading-7 text-stone-300">
            Edit saved placements and submit this draft from the dashboard release manager. An admin reviews and publishes approved schedules.
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <h2 className="text-2xl font-semibold text-stone-50">
          Constraint-aware scheduling behavior
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.25rem] border border-stone-700 bg-stone-950/80 p-5">
            <h3 className="text-lg font-semibold text-stone-50">Locked sessions first</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Fixed academic commitments are scheduled as anchors before optional sessions are
              considered.
            </p>
          </article>
          <article className="rounded-[1.25rem] border border-stone-700 bg-stone-950/80 p-5">
            <h3 className="text-lg font-semibold text-stone-50">Teacher-safe decisions</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Sessions are now blocked early if they overlap with an already accepted class for
              the same teacher.
            </p>
          </article>
          <article className="rounded-[1.25rem] border border-stone-700 bg-stone-950/80 p-5">
            <h3 className="text-lg font-semibold text-stone-50">Batch-safe decisions</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              The engine also avoids placing overlapping sessions for the same batch when an
              anchor already exists.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
        <h2 className="text-2xl font-semibold text-stone-50">AI-ready explanation feed</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {explanationCards.map((card) => (
            <article
              key={`${card.title}-${card.description}`}
              className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-5"
            >
              <h3 className="text-lg font-semibold text-stone-50">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-300">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <WeeklyTimetableGrid
        title="Draft calendar preview"
        description="Review the generated assignments in a weekly view. Draft placements can be moved between days and hourly slots before review."
        entries={draftEntries}
        emptyMessage={latestSchedule ? "This saved draft has no room assignments." : "Generate a draft to preview room assignments here."}
        scheduleId={latestSchedule?.id}
        editable={latestSchedule?.status === "DRAFT" && !apiUnavailable}
      />

      {unscheduledConflicts.length > 0 ? <ConflictList conflicts={unscheduledConflicts} /> : null}
    </AppShell>
  );
}
