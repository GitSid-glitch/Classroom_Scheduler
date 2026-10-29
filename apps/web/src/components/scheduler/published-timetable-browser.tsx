"use client";

import { useMemo, useState } from "react";

import type { ScheduleRunResponse } from "@/lib/api/scheduler-api-client";
import {
  WeeklyTimetableGrid,
  type WeeklyTimetableEntry,
} from "@/components/scheduler/weekly-timetable-grid";
import type { CourseOffering, Room } from "@/types/domain";

type TimetableEntry = {
  assignmentId: number;
  title: string;
  teacher: string;
  section: string;
  room: string;
  dayCode: CourseOffering["dayCode"];
  startTime: string;
  endTime: string;
};

type Scope = "section" | "teacher" | "room";

const dayLabels: CourseOffering["dayCode"][] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

function displayTime(value: string) {
  return value.slice(0, 5);
}

interface PublishedTimetableBrowserProps {
  schedules: ScheduleRunResponse[];
  offerings: CourseOffering[];
  rooms: Room[];
  initialScope?: Scope;
  initialQuery?: string;
}

export function PublishedTimetableBrowser({
  schedules,
  offerings,
  rooms,
  initialScope = "section",
  initialQuery = "",
}: PublishedTimetableBrowserProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState(String(schedules[0]?.id ?? ""));
  const [scope, setScope] = useState<Scope>(initialScope);
  const [query, setQuery] = useState(initialQuery);

  const selectedSchedule = schedules.find((schedule) => String(schedule.id) === selectedScheduleId);

  const entries = useMemo<TimetableEntry[]>(() => {
    if (!selectedSchedule) {
      return [];
    }

    return selectedSchedule.assignments
      .map((assignment) => {
        const offering = offerings.find((item) => item.id === String(assignment.class_session));
        const room = rooms.find((item) => item.id === String(assignment.room));

        if ((!offering && !assignment.subject_snapshot) || (!room && !assignment.room_name_snapshot)) {
          return null;
        }

        return {
          assignmentId: assignment.id,
          title: assignment.subject_snapshot || offering?.title || "Class session",
          teacher: assignment.teacher_snapshot || offering?.teacherName || offering?.teacherId || "Faculty",
          section: assignment.batch_snapshot || offering?.sectionName || offering?.sectionId || "Section",
          room: assignment.room_name_snapshot || room?.name || "Room",
          dayCode: assignment.day_of_week_snapshot || offering?.dayCode || "MON",
          startTime: assignment.start_time_snapshot || offering?.startTime || "09:00",
          endTime: assignment.end_time_snapshot || offering?.endTime || "10:00",
        };
      })
      .filter((entry): entry is TimetableEntry => entry !== null)
      .sort((left, right) => {
        if (left.dayCode !== right.dayCode) {
          return dayLabels.indexOf(left.dayCode) - dayLabels.indexOf(right.dayCode);
        }

        return left.startTime.localeCompare(right.startTime);
      });
  }, [offerings, rooms, selectedSchedule]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) => {
      const scopeValue =
        scope === "teacher" ? entry.teacher : scope === "room" ? entry.room : entry.section;
      return scopeValue.toLowerCase().includes(normalizedQuery);
    });
  }, [entries, query, scope]);

  const groupedEntries = useMemo(() => {
    return dayLabels.map((dayCode) => ({
      dayCode,
      items: filteredEntries.filter((entry) => entry.dayCode === dayCode),
    }));
  }, [filteredEntries]);

  const calendarEntries = useMemo<WeeklyTimetableEntry[]>(
    () =>
      filteredEntries.map((entry) => ({
        id: String(entry.assignmentId),
        title: entry.title,
        subtitle: `${entry.section} • ${entry.teacher}`,
        meta: `Room ${entry.room}`,
        dayCode: entry.dayCode,
        startTime: entry.startTime,
        endTime: entry.endTime,
        roomId: "",
      })),
    [filteredEntries],
  );

  return (
    <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#17665b]">
            Published Access
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-50">
            Browse the released timetable
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-300">
            Filter the published schedule by section, teacher, or room to simulate the read-only
            experience real institutions need after timetable approval.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-2 text-sm text-stone-200">
            Schedule
            <select
              className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-stone-50"
              value={selectedScheduleId}
              onChange={(event) => setSelectedScheduleId(event.target.value)}
            >
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-stone-200">
            View scope
            <select
              className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-stone-50"
              value={scope}
              onChange={(event) => {
                setScope(event.target.value as Scope);
                setQuery("");
              }}
            >
              <option value="section">Section</option>
              <option value="teacher">Teacher</option>
              <option value="room">Room</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-stone-200">
            Search
            <input
              className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-stone-50"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                scope === "teacher"
                  ? "e.g. Dr. Roy"
                  : scope === "room"
                    ? "e.g. A-101"
                    : "e.g. B.Tech CSE 4A"
              }
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4">
          <p className="text-sm text-stone-400">Released schedule</p>
          <p className="mt-2 text-lg font-semibold text-stone-50">
            {selectedSchedule?.name ?? "No schedule selected"}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4">
          <p className="text-sm text-stone-400">Scheduled entries</p>
          <p className="mt-2 text-lg font-semibold text-stone-50">{filteredEntries.length}</p>
        </div>
        <div className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4">
          <p className="text-sm text-stone-400">Published at</p>
          <p className="mt-2 text-lg font-semibold text-stone-50">
            {selectedSchedule?.published_at ?? "Recently published"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {groupedEntries.map((group) => (
          <article
            key={group.dayCode}
            className="rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-50">{group.dayCode}</h3>
              <p className="text-sm text-stone-400">{group.items.length} entries</p>
            </div>

            <div className="mt-4 grid gap-3">
              {group.items.length === 0 ? (
                <div className="rounded-[1rem] border border-dashed border-stone-700 p-4 text-sm text-stone-400">
                  No published entries for this day and filter combination.
                </div>
              ) : null}

              {group.items.map((entry) => (
                <div
                  key={entry.assignmentId}
                  className="rounded-[1rem] border border-stone-700 bg-stone-950/70 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-stone-50">{entry.title}</p>
                      <p className="mt-1 text-sm text-stone-300">
                        {displayTime(entry.startTime)} - {displayTime(entry.endTime)}
                      </p>
                    </div>
                    <div className="text-sm text-stone-300">
                      <p>Teacher: {entry.teacher}</p>
                      <p>Section: {entry.section}</p>
                      <p>Room: {entry.room}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <WeeklyTimetableGrid
          title="Weekly calendar view"
          description="A denser calendar view helps faculty and students understand the released timetable faster than scanning cards day by day."
          entries={calendarEntries}
          emptyMessage="No published timetable entries are available for the current filter."
        />
      </div>
    </section>
  );
}
