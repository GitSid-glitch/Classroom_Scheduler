"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SchedulerApiClient, type ScheduleRunResponse } from "@/lib/api/scheduler-api-client";
import type { CourseOffering, Room } from "@/types/domain";

const apiClient = new SchedulerApiClient();
const days: Array<{ value: CourseOffering["dayCode"]; label: string }> = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
];

type ScheduleAssignment = ScheduleRunResponse["assignments"][number];

interface ScheduleAssignmentEditorProps {
  scheduleId: number;
  assignments: ScheduleAssignment[];
  rooms: Room[];
  onSaved?: (schedule: ScheduleRunResponse) => void;
}

export function ScheduleAssignmentEditor({ scheduleId, assignments, rooms, onSaved }: ScheduleAssignmentEditorProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [placement, setPlacement] = useState({
    day_of_week: "MON" as CourseOffering["dayCode"],
    start_time: "09:00",
    end_time: "10:00",
    room: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function beginEdit(assignment: ScheduleAssignment) {
    setEditingId(assignment.id);
    setPlacement({
      day_of_week: assignment.day_of_week_snapshot,
      start_time: assignment.start_time_snapshot.slice(0, 5),
      end_time: assignment.end_time_snapshot.slice(0, 5),
      room: String(assignment.room),
    });
    setError(null);
    setMessage(null);
  }

  function savePlacement(assignmentId: number) {
    if (!placement.room) {
      setError("Choose a room for this class.");
      return;
    }
    if (placement.end_time <= placement.start_time) {
      setError("The end time must be later than the start time.");
      return;
    }

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const updatedSchedule = await apiClient.moveScheduleAssignment(scheduleId, assignmentId, {
          ...placement,
          room: Number(placement.room),
        });
        onSaved?.(updatedSchedule);
        setEditingId(null);
        setMessage("Placement saved to this draft. The rest of the schedule history is unchanged.");
        router.refresh();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Could not save this placement.");
      }
    });
  }

  return (
    <section className="rounded-xl border border-[#e1ebe6] bg-white p-4" aria-labelledby={`saved-placement-editor-title-${scheduleId}`} aria-busy={isPending}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#17665b]">Draft adjustments</p>
        <h2 id={`saved-placement-editor-title-${scheduleId}`} className="mt-2 text-lg font-semibold tracking-tight text-stone-50">Adjust saved placements</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
          Changes are saved to this draft’s placement snapshots. The scheduler checks room, teacher, section, capacity, and blackout conflicts before saving.
        </p>
      </div>

      {message ? <p role="status" className="mt-4 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p> : null}

      {assignments.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-[#dce6e1] p-4 text-sm text-stone-500">This draft has no scheduled placements to adjust.</p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {assignments.map((assignment) => {
            const isEditing = editingId === assignment.id;
            return (
              <li key={assignment.id} className="rounded-xl border border-[#e1ebe6] bg-[#fbfcfb] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-50">{assignment.subject_snapshot}</h3>
                    <p className="mt-1 text-xs text-stone-500">{assignment.batch_snapshot} · {assignment.teacher_snapshot}</p>
                    {!isEditing ? <p className="mt-2 text-sm text-stone-600">{days.find((day) => day.value === assignment.day_of_week_snapshot)?.label} · {assignment.start_time_snapshot.slice(0, 5)}–{assignment.end_time_snapshot.slice(0, 5)} · {assignment.room_name_snapshot}</p> : null}
                  </div>
                  {!isEditing ? (
                    <button type="button" onClick={() => beginEdit(assignment)} disabled={isPending || rooms.length === 0} className="shrink-0 rounded-lg border border-[#dce6e1] bg-white px-3.5 py-2 text-xs font-semibold text-[#243a34] hover:bg-[#f4faf7] disabled:opacity-60">
                      Edit placement
                    </button>
                  ) : null}
                </div>
                {!isEditing && rooms.length === 0 ? <p className="mt-2 text-xs text-amber-800">Room data is unavailable, so placement edits are paused.</p> : null}

                {isEditing ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-1.5 text-xs font-medium text-stone-600">Day
                      <select className="field-control px-3 py-2 text-sm" value={placement.day_of_week} onChange={(event) => setPlacement((current) => ({ ...current, day_of_week: event.target.value as CourseOffering["dayCode"] }))}>
                        {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-medium text-stone-600">Starts at
                      <input className="field-control px-3 py-2 text-sm" type="time" value={placement.start_time} onChange={(event) => setPlacement((current) => ({ ...current, start_time: event.target.value }))} required />
                    </label>
                    <label className="grid gap-1.5 text-xs font-medium text-stone-600">Ends at
                      <input className="field-control px-3 py-2 text-sm" type="time" value={placement.end_time} onChange={(event) => setPlacement((current) => ({ ...current, end_time: event.target.value }))} required />
                    </label>
                    <label className="grid gap-1.5 text-xs font-medium text-stone-600">Room
                      <select className="field-control px-3 py-2 text-sm" value={placement.room} onChange={(event) => setPlacement((current) => ({ ...current, room: event.target.value }))} required>
                        <option value="">Choose a room</option>
                        {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.roomType} · {room.capacity} seats</option>)}
                      </select>
                    </label>
                    <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4">
                      <button type="button" onClick={() => savePlacement(assignment.id)} disabled={isPending} className="btn-primary rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-60">{isPending ? "Saving…" : "Save placement"}</button>
                      <button type="button" onClick={() => { setEditingId(null); setError(null); }} disabled={isPending} className="rounded-lg border border-[#dce6e1] bg-white px-3.5 py-2 text-xs font-semibold text-[#354b45] disabled:opacity-60">Cancel</button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
