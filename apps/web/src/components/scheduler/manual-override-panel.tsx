"use client";

import { useMemo, useState, useTransition } from "react";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import type { CourseOffering, DayCode, Room } from "@/types/domain";

const apiClient = new SchedulerApiClient();
const days: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface ManualOverridePanelProps {
  initialOfferings: CourseOffering[];
  rooms: Room[];
}

export function ManualOverridePanel({
  initialOfferings,
  rooms,
}: ManualOverridePanelProps) {
  const [offerings, setOfferings] = useState(initialOfferings);
  const [selectedId, setSelectedId] = useState(initialOfferings[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedOffering = useMemo(
    () => offerings.find((offering) => offering.id === selectedId) ?? offerings[0],
    [offerings, selectedId],
  );

  const [form, setForm] = useState(() => ({
    dayCode: initialOfferings[0]?.dayCode ?? ("MON" as DayCode),
    startTime: initialOfferings[0]?.startTime.slice(0, 5) ?? "09:00",
    endTime: initialOfferings[0]?.endTime.slice(0, 5) ?? "10:00",
    fixedRoomId: initialOfferings[0]?.fixedRoomId ?? "",
    isLocked: initialOfferings[0]?.isLocked ?? false,
  }));

  function syncForm(offering: CourseOffering | undefined) {
    if (!offering) {
      return;
    }

    setForm({
      dayCode: offering.dayCode,
      startTime: offering.startTime.slice(0, 5),
      endTime: offering.endTime.slice(0, 5),
      fixedRoomId: offering.fixedRoomId ?? "",
      isLocked: offering.isLocked,
    });
  }

  function handleOfferingChange(offeringId: string) {
    setSelectedId(offeringId);
    syncForm(offerings.find((offering) => offering.id === offeringId));
    setError(null);
    setMessage(null);
  }

  function handleSave() {
    if (!selectedOffering) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const updated = await apiClient.updateCourseOffering(selectedOffering.id, {
          title: selectedOffering.title,
          teacher: selectedOffering.teacherName ?? selectedOffering.teacherId,
          teacherRecordId: selectedOffering.teacherRecordId ?? null,
          batch: selectedOffering.sectionName ?? selectedOffering.sectionId,
          sectionRecordId: selectedOffering.sectionRecordId ?? null,
          fixedRoomId: form.fixedRoomId || null,
          dayCode: form.dayCode,
          startTime: form.startTime,
          endTime: form.endTime,
          requiredCapacity: selectedOffering.requiredCapacity,
          requiredRoomType: selectedOffering.requiredRoomType,
          priorityScore: selectedOffering.priorityScore,
          isLocked: form.isLocked,
          teacherUnavailableDays: selectedOffering.teacherUnavailableDays,
          requiredFeatures: selectedOffering.requiredFeatures,
        });

        setOfferings((current) =>
          current.map((offering) => (offering.id === updated.id ? updated : offering)),
        );
        setMessage("Manual override saved. Re-run the scheduler to evaluate the updated plan.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save override.");
      }
    });
  }

  const overriddenOfferings = offerings.filter((offering) => offering.isLocked || offering.fixedRoomId);

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
            Manual Overrides
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-50">
            Lock, reslot, and pin a session to a room
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-300">
            This gives coordinators a controlled escape hatch when institutional context matters
            more than a pure optimization run.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950 p-5">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-stone-200">
              Session
              <select
                className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-stone-50"
                value={selectedOffering?.id ?? ""}
                onChange={(event) => handleOfferingChange(event.target.value)}
              >
                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.title} • {offering.sectionName ?? offering.sectionId}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm text-stone-200">
                Day
                <select
                  className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-stone-50"
                  value={form.dayCode}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dayCode: event.target.value as DayCode }))
                  }
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-stone-200">
                Start
                <input
                  className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-stone-50"
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startTime: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-stone-200">
                End
                <input
                  className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-stone-50"
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endTime: event.target.value }))
                  }
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-stone-200">
              Fixed room override
              <select
                className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-stone-50"
                value={form.fixedRoomId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fixedRoomId: event.target.value }))
                }
              >
                <option value="">Auto-assign room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} • {room.roomType} • Capacity {room.capacity}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 text-sm text-stone-200">
              <input
                type="checkbox"
                checked={form.isLocked}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isLocked: event.target.checked }))
                }
              />
              Keep this session locked during future scheduling runs
            </label>

            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !selectedOffering}
              className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {isPending ? "Saving override..." : "Save override"}
            </button>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950 p-5">
          <h3 className="text-xl font-semibold text-stone-50">Current manual constraints</h3>
          <div className="mt-4 grid gap-3">
            {overriddenOfferings.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-stone-700 p-4 text-sm text-stone-400">
                No manual overrides yet. The optimizer is still operating on a fully automatic plan.
              </div>
            ) : null}

            {overriddenOfferings.map((offering) => (
              <article
                key={offering.id}
                className="rounded-[1rem] border border-stone-700 bg-stone-900/70 p-4"
              >
                <p className="text-base font-semibold text-stone-50">{offering.title}</p>
                <p className="mt-1 text-sm text-stone-300">
                  {offering.dayCode} • {offering.startTime} - {offering.endTime}
                </p>
                <p className="mt-2 text-sm text-stone-400">
                  {offering.isLocked ? "Locked session" : "Flexible session"}
                  {offering.fixedRoomId
                    ? ` • Fixed room ${rooms.find((room) => room.id === offering.fixedRoomId)?.name ?? offering.fixedRoomId}`
                    : " • Auto room assignment"}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
