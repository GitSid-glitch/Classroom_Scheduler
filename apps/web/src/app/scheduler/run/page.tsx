import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { ConflictList } from "@/components/scheduler/conflict-list";
import { ManualOverridePanel } from "@/components/scheduler/manual-override-panel";
import { StatusBoard } from "@/components/scheduler/status-board";
import { AcademicRepository } from "@/lib/repositories/academic-repository";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

const repository = new AcademicRepository();
const apiClient = new SchedulerApiClient();

export default async function SchedulerRunPage() {
  const [offerings, rooms] = await Promise.all([
    repository.getCourseOfferings(),
    repository.getRooms(),
  ]);

  let maxValue = offerings.reduce((sum, offering) => sum + offering.priorityScore, 0);
  let minRooms = Math.max(1, Math.ceil(offerings.length / 2));
  let scheduledCount = offerings.length;
  let scheduleStatus: "DRAFT" | "PUBLISHED" = "DRAFT";
  let unscheduledConflicts: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }> = [];
  let explanationCards: Array<{
    title: string;
    description: string;
  }> = [];

  try {
    const schedule = await apiClient.runOptimizedSchedule();
    maxValue = schedule.max_value;
    minRooms = schedule.min_rooms;
    scheduledCount = schedule.scheduled_class_ids.length;
    scheduleStatus = schedule.status;
    unscheduledConflicts = schedule.unscheduled.map((item) => ({
      title: `${item.subject} (${item.day_of_week} ${item.start_time}-${item.end_time})`,
      description: item.reason,
      severity:
        item.reason.includes("Teacher") || item.reason.includes("Batch") ? "medium" : "high",
    }));
    explanationCards = schedule.explanations.map((item) => ({
      title: item.type.replaceAll("_", " "),
      description: item.message,
    }));
  } catch {
    scheduledCount = offerings.filter((offering) => offering.requiredRoomType !== "AUDITORIUM").length;
    unscheduledConflicts = [
      {
        title: "Backend schedule insights unavailable",
        description:
          "The frontend fell back to demo assumptions because the scheduling API was not reachable.",
        severity: "low",
      },
    ];
    explanationCards = [
      {
        title: "Fallback state",
        description:
          "Backend explanations are unavailable, so the frontend is showing a reduced demo experience.",
      },
    ];
  }

  return (
    <AppShell
      eyebrow="Scheduler / Run"
      title="Draft generation and review workflow"
      description="This route is where a coordinator should generate a draft, inspect whether the algorithm actually satisfied institutional constraints, and move into conflict review when it did not."
      actions={
        <>
          <Link
            href="/dashboard"
            className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
          >
            Open release manager
          </Link>
          <Link
            href="/scheduler/conflicts"
            className="rounded-full border border-stone-500 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
          >
            Open conflict center
          </Link>
        </>
      }
    >
      <StatusBoard
        scheduledCount={scheduledCount}
        totalCount={offerings.length}
        minRooms={minRooms}
        maxValue={maxValue}
      />

      <ManualOverridePanel initialOfferings={offerings} rooms={rooms} />

      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
              Schedule lifecycle
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-50">
              Current draft status: {scheduleStatus}
            </h2>
          </div>
          <div className="inline-flex rounded-full border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-100">
            Publish/unpublish actions are now supported on the backend API
          </div>
        </div>
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

      <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
        <h2 className="text-2xl font-semibold text-stone-50">How this grows into a real product</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-5">
            <h3 className="text-lg font-semibold text-stone-50">Locked session support</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Coordinators should be able to freeze critical classes and rerun only the
              remaining draft space.
            </p>
          </article>
          <article className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-5">
            <h3 className="text-lg font-semibold text-stone-50">Explainable tradeoffs</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Every unscheduled class should point to a concrete reason: room mismatch,
              availability issue, or lower-priority collision.
            </p>
          </article>
          <article className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-5">
            <h3 className="text-lg font-semibold text-stone-50">Scenario comparison</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Admins should compare strategy A vs B before publishing instead of trusting a
              single opaque run.
            </p>
          </article>
        </div>
      </section>

      <ConflictList conflicts={unscheduledConflicts} />
    </AppShell>
  );
}
