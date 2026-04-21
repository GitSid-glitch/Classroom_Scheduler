"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

type ScheduleSummary = Awaited<
  ReturnType<SchedulerApiClient["listSchedules"]>
>[number];

const apiClient = new SchedulerApiClient();

interface ScheduleReleaseManagerProps {
  initialSchedules: ScheduleSummary[];
}

export function ScheduleReleaseManager({
  initialSchedules,
}: ScheduleReleaseManagerProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(schedule: ScheduleSummary) {
    setError(null);

    startTransition(async () => {
      try {
        const updated =
          schedule.status === "PUBLISHED"
            ? await apiClient.unpublishSchedule(schedule.id)
            : await apiClient.publishSchedule(schedule.id);

        setSchedules((current) =>
          current.map((item) => (item.id === schedule.id ? updated : item)),
        );
      } catch (toggleError) {
        setError(
          toggleError instanceof Error
            ? toggleError.message
            : "Failed to update schedule status.",
        );
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
            Release Workflow
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-50">
            Publish and manage generated schedules
          </h2>
        </div>
        <Link
          href="/published-timetable"
          className="inline-flex items-center justify-center rounded-full border border-stone-500 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
        >
          Open published timetable
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-6 grid gap-3">
        {schedules.length === 0 ? (
          <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4 text-sm text-stone-300">
            No schedules have been generated yet.
          </div>
        ) : null}

        {schedules.map((schedule) => (
          <article
            key={schedule.id}
            className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-semibold text-stone-50">{schedule.name}</p>
                <p className="mt-1 text-sm text-stone-300">
                  Status: {schedule.status}
                  {schedule.published_at ? ` • Published at ${schedule.published_at}` : ""}
                </p>
                <p className="mt-2 text-sm text-stone-400">
                  Scheduled classes: {schedule.scheduled_class_ids.length} • Rooms used:{" "}
                  {schedule.min_rooms} • Value: {schedule.max_value}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(schedule)}
                disabled={isPending}
                className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
              >
                {schedule.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
