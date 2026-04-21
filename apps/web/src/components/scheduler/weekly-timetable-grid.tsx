"use client";

import { Fragment } from "react";

import type { DayCode } from "@/types/domain";

export interface WeeklyTimetableEntry {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  dayCode: DayCode;
  startTime: string;
  endTime: string;
}

const dayLabels: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function buildTimeSlots(entries: WeeklyTimetableEntry[]) {
  const minutes = entries.flatMap((entry) => [toMinutes(entry.startTime), toMinutes(entry.endTime)]);
  const earliest = minutes.length > 0 ? Math.min(...minutes) : 9 * 60;
  const latest = minutes.length > 0 ? Math.max(...minutes) : 17 * 60;
  const startHour = Math.max(8, Math.floor(earliest / 60));
  const endHour = Math.min(19, Math.ceil(latest / 60));

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
}

export function WeeklyTimetableGrid({
  title,
  description,
  entries,
  emptyMessage,
}: WeeklyTimetableGridProps) {
  const timeSlots = buildTimeSlots(entries);

  return (
    <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-stone-50">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-stone-300">{description}</p>
      </div>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-[1.25rem] border border-dashed border-stone-700 p-5 text-sm text-stone-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <div className="grid min-w-[980px] grid-cols-[96px_repeat(6,minmax(0,1fr))] gap-3">
            <div className="rounded-2xl border border-stone-700 bg-stone-900/80 p-4 text-sm font-semibold text-stone-300">
              Time
            </div>
            {dayLabels.map((dayCode) => (
              <div
                key={dayCode}
                className="rounded-2xl border border-stone-700 bg-stone-900/80 p-4 text-sm font-semibold text-stone-100"
              >
                {dayCode}
              </div>
            ))}

            {timeSlots.map((slot) => (
              <Fragment key={slot}>
                <div
                  className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-400"
                >
                  {slot}
                </div>
                {dayLabels.map((dayCode) => {
                  const slotStart = toMinutes(slot);
                  const slotEnd = slotStart + 60;
                  const slotEntries = entries.filter((entry) => {
                    if (entry.dayCode !== dayCode) {
                      return false;
                    }

                    const entryStart = toMinutes(entry.startTime);
                    const entryEnd = toMinutes(entry.endTime);
                    return entryStart < slotEnd && entryEnd > slotStart;
                  });

                  return (
                    <div
                      key={`${dayCode}-${slot}`}
                      className="min-h-28 rounded-2xl border border-stone-800 bg-stone-900/30 p-3"
                    >
                      <div className="grid gap-2">
                        {slotEntries.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-stone-800 px-3 py-4 text-xs text-stone-500">
                            Free
                          </div>
                        ) : null}
                        {slotEntries.map((entry) => (
                          <article
                            key={entry.id}
                            className="rounded-xl border border-sky-300/20 bg-sky-300/10 p-3 text-sm text-sky-50"
                          >
                            <p className="font-semibold">{entry.title}</p>
                            <p className="mt-1 text-xs text-sky-100/80">
                              {entry.startTime} - {entry.endTime}
                            </p>
                            <p className="mt-2 text-xs text-sky-100/80">{entry.subtitle}</p>
                            <p className="mt-1 text-xs text-sky-100/70">{entry.meta}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
