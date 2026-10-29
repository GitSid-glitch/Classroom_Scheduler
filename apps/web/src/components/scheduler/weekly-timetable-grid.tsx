"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import type { DayCode } from "@/types/domain";

export interface WeeklyTimetableEntry {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  dayCode: DayCode;
  startTime: string;
  endTime: string;
  roomId: string;
}

const dayLabels: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const apiClient = new SchedulerApiClient();

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function displayTime(value: string) {
  return value.slice(0, 5);
}

function buildTimeSlots(entries: WeeklyTimetableEntry[]) {
  const minutes = entries.flatMap((entry) => [toMinutes(entry.startTime), toMinutes(entry.endTime)]);
  const earliest = minutes.length > 0 ? Math.min(...minutes) : 9 * 60;
  const latest = minutes.length > 0 ? Math.max(...minutes) : 17 * 60;
  const startHour = Math.max(8, Math.floor(earliest / 60));
  const endHour = Math.min(23, Math.max(startHour + 1, Math.ceil(latest / 60)));

  return Array.from({ length: endHour - startHour }, (_, index) => {
    const hour = startHour + index;
    return `${String(hour).padStart(2, "0")}:00`;
  });
}

interface WeeklyTimetableGridProps {
  title: string;
  description: string;
  entries: WeeklyTimetableEntry[];
  emptyMessage: string;
  scheduleId?: number;
  editable?: boolean;
}

export function WeeklyTimetableGrid({
  title,
  description,
  entries,
  emptyMessage,
  scheduleId,
  editable = false,
}: WeeklyTimetableGridProps) {
  const router = useRouter();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<{
    entryId: string;
    dayCode: DayCode;
    startTime: string;
  } | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const noticeRef = useRef<HTMLParagraphElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const timeSlots = buildTimeSlots(entries);
  const moveTimeOptions = [...new Set([
    ...timeSlots,
    ...entries.map((entry) => entry.startTime.slice(0, 5)),
  ])].sort();
  const canMove = editable && scheduleId !== undefined;

  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  function moveEntry(entryId: string, dayCode: DayCode, slot: string) {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry || scheduleId === undefined) return;

    const duration = toMinutes(entry.endTime) - toMinutes(entry.startTime);
    const start = toMinutes(slot);
    const end = start + duration;
    if (duration <= 0 || end > 23 * 60) {
      setNotice({ kind: "error", text: "This class cannot be moved beyond the timetable’s 11:00 PM limit." });
      return;
    }
    if (!entry.roomId) {
      setNotice({ kind: "error", text: "This class has no saved room. Use the placement editor on the dashboard to choose one." });
      return;
    }

    const timeText = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    setNotice(null);
    startTransition(async () => {
      try {
        await apiClient.moveScheduleAssignment(scheduleId, Number(entryId), {
          day_of_week: dayCode,
          start_time: timeText(start),
          end_time: timeText(end),
          room: Number(entry.roomId),
        });
        setMoveTarget(null);
        setNotice({ kind: "success", text: `${entry.title} moved to ${dayCode} at ${timeText(start)}. The server checked the scheduling constraints.` });
        router.refresh();
      } catch (error) {
        setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not move this class. Try the placement editor on the dashboard." });
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-stone-50">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-stone-300">{description}</p>
      </div>

      {canMove ? (
        <div className="mt-4 rounded-xl border border-[#b9d9ce] bg-[#eaf4f0] px-4 py-3 text-sm text-[#142622]" aria-live="polite">
          <p>Drag a class to another day or hour, or open its “Move session” controls to choose a day and start time. Duration and room stay the same; the server checks conflicts before saving.</p>
        </div>
      ) : null}
      {notice ? <p ref={noticeRef} tabIndex={-1} className={`mt-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17665b] ${notice.kind === "error" ? "text-rose-700" : "text-emerald-800"}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p> : null}

      {entries.length === 0 ? (
        <div className="mt-6 rounded-[1.25rem] border border-dashed border-stone-700 p-5 text-sm text-stone-400">
          {emptyMessage}
        </div>
      ) : (
        <>
          <p className="mt-5 text-xs text-stone-500 sm:hidden">
            Scroll horizontally to view all six days. The timetable can also be focused and scrolled with your keyboard.
          </p>
          <p id="weekly-timetable-scroll-help" className="sr-only">
            This table scrolls horizontally. Focus the timetable and use the left and right arrow keys to view every day.
          </p>
          <div
            className="mt-3 overflow-x-auto rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17665b]"
            role="region"
            aria-label="Weekly timetable"
            aria-describedby="weekly-timetable-scroll-help"
            tabIndex={0}
          >
            <table className="w-full min-w-[980px] border-separate border-spacing-2">
              <caption className="sr-only">{title}, arranged by time and day of week</caption>
              <thead>
                <tr>
                  <th scope="col" className="rounded-xl border border-stone-700 bg-stone-900/80 p-4 text-left text-sm font-semibold text-stone-300">Time</th>
                  {dayLabels.map((dayCode) => (
                    <th key={dayCode} scope="col" className="rounded-xl border border-stone-700 bg-stone-900/80 p-4 text-left text-sm font-semibold text-stone-100">{dayCode}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot}>
                    <th scope="row" className="rounded-xl border border-stone-800 bg-stone-900/60 p-4 text-left align-top text-sm font-medium text-stone-400">{slot}</th>
                    {dayLabels.map((dayCode) => {
                      const slotStart = toMinutes(slot);
                      const slotEntries = entries.filter((entry) =>
                        entry.dayCode === dayCode &&
                        toMinutes(entry.startTime) >= slotStart &&
                        toMinutes(entry.startTime) < slotStart + 60,
                      );

                      return (
                        <td
                          key={`${dayCode}-${slot}`}
                          onDragOver={canMove ? (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(`${dayCode}-${slot}`); } : undefined}
                          onDragLeave={canMove ? (event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null); } : undefined}
                          onDrop={canMove ? (event) => {
                            event.preventDefault();
                            const entryId = event.dataTransfer.getData("text/plain") || draggedId;
                            setDraggedId(null);
                            setDropTarget(null);
                            if (entryId) moveEntry(entryId, dayCode, slot);
                          } : undefined}
                          className={`min-w-32 rounded-xl border p-2 align-top transition-colors ${dropTarget === `${dayCode}-${slot}` && draggedId ? "border-emerald-400 bg-emerald-400/15" : "border-stone-800 bg-stone-900/30"}`}
                        >
                          {slotEntries.length === 0 ? (
                            <span className="px-2 py-2 text-xs text-stone-500" aria-hidden="true">—</span>
                          ) : (
                            <div className="grid gap-2">
                              {slotEntries.map((entry) => (
                                <article
                                  key={entry.id}
                                  aria-label={`${entry.title}, ${dayCode}, ${entry.startTime} to ${entry.endTime}, ${entry.subtitle}, ${entry.meta}`}
                                  draggable={canMove && !isPending}
                                  onDragStart={canMove ? (event) => {
                                    event.dataTransfer.effectAllowed = "move";
                                    event.dataTransfer.setData("text/plain", entry.id);
                                    setDraggedId(entry.id);
                                    setNotice(null);
                                  } : undefined}
                                  onDragEnd={canMove ? () => { setDraggedId(null); setDropTarget(null); } : undefined}
                                  className={`rounded-lg border border-[#c6ddd5] bg-[#eef6f2] p-3 text-sm text-[#142622] ${canMove ? "cursor-grab active:cursor-grabbing" : ""} ${draggedId === entry.id ? "opacity-45" : ""}`}
                                >
                                  <p className="font-semibold">{entry.title}</p>
                                  {canMove ? <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#17665b]">Drag to move</p> : null}
                                  <p className="mt-1 text-xs text-[#354b45]">{displayTime(entry.startTime)} - {displayTime(entry.endTime)}</p>
                                  <p className="mt-2 text-xs text-[#354b45]">{entry.subtitle}</p>
                                  <p className="mt-1 text-xs text-[#43564f]">{entry.meta}</p>
                                  {canMove ? (
                                    <div className="mt-3 border-t border-white/10 pt-3">
                                      <button
                                        type="button"
                                        aria-expanded={moveTarget?.entryId === entry.id}
                                        aria-controls={`move-session-${entry.id}`}
                                        aria-label={`Move ${entry.title}`}
                                        disabled={isPending}
                                        onClick={() => setMoveTarget((current) => current?.entryId === entry.id
                                          ? null
                                          : { entryId: entry.id, dayCode: entry.dayCode, startTime: entry.startTime.slice(0, 5) })}
                                        className="rounded-md border border-[#8aa69b] px-2.5 py-1.5 text-xs font-semibold text-[#17665b] underline-offset-2 hover:bg-[#e1eee8] hover:underline focus-visible:outline-[#17665b] disabled:opacity-60"
                                      >
                                        Move session
                                      </button>
                                      <div id={`move-session-${entry.id}`} hidden={moveTarget?.entryId !== entry.id} className="mt-3 grid gap-2">
                                        <label htmlFor={`move-day-${entry.id}`} className="text-xs font-medium text-[#243a34]">Day</label>
                                        <select
                                          id={`move-day-${entry.id}`}
                                          className="field-control px-2 py-1.5 text-xs"
                                          value={moveTarget?.entryId === entry.id ? moveTarget.dayCode : entry.dayCode}
                                          disabled={isPending}
                                          onChange={(event) => setMoveTarget((current) => current?.entryId === entry.id
                                            ? { ...current, dayCode: event.target.value as DayCode }
                                            : current)}
                                        >
                                          {dayLabels.map((day) => <option key={day} value={day}>{day}</option>)}
                                        </select>
                                        <label htmlFor={`move-time-${entry.id}`} className="text-xs font-medium text-[#243a34]">Start time</label>
                                        <select
                                          id={`move-time-${entry.id}`}
                                          className="field-control px-2 py-1.5 text-xs"
                                          value={moveTarget?.entryId === entry.id ? moveTarget.startTime : entry.startTime.slice(0, 5)}
                                          disabled={isPending}
                                          onChange={(event) => setMoveTarget((current) => current?.entryId === entry.id
                                            ? { ...current, startTime: event.target.value }
                                            : current)}
                                        >
                                          {moveTimeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
                                        </select>
                                        <button
                                          type="button"
                                          disabled={isPending || moveTarget?.entryId !== entry.id}
                                          onClick={() => moveTarget?.entryId === entry.id && moveEntry(moveTarget.entryId, moveTarget.dayCode, moveTarget.startTime)}
                                          className="btn-primary mt-1 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-60"
                                        >
                                          {isPending ? "Saving…" : "Save move"}
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}
                                </article>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
