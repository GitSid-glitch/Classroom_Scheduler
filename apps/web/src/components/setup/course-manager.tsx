"use client";

import { useState, useTransition } from "react";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import type { CourseOffering, DayCode } from "@/types/domain";

const apiClient = new SchedulerApiClient();

interface CourseManagerProps {
  initialOfferings: CourseOffering[];
}

const days: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function CourseManager({ initialOfferings }: CourseManagerProps) {
  const [offerings, setOfferings] = useState(initialOfferings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    teacher: "",
    batch: "",
    dayCode: "MON" as DayCode,
    startTime: "09:00",
    endTime: "10:00",
    requiredCapacity: "30",
    requiredRoomType: "ANY" as CourseOffering["requiredRoomType"],
    priorityScore: "5",
    isLocked: false,
    teacherUnavailableDays: "",
    requiredFeatures: "",
  });

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      teacher: "",
      batch: "",
      dayCode: "MON",
      startTime: "09:00",
      endTime: "10:00",
      requiredCapacity: "30",
      requiredRoomType: "ANY",
      priorityScore: "5",
      isLocked: false,
      teacherUnavailableDays: "",
      requiredFeatures: "",
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const payload = {
          title: form.title,
          teacher: form.teacher,
          batch: form.batch,
          dayCode: form.dayCode,
          startTime: form.startTime,
          endTime: form.endTime,
          requiredCapacity: Number(form.requiredCapacity),
          requiredRoomType: form.requiredRoomType,
          priorityScore: Number(form.priorityScore),
          isLocked: form.isLocked,
          teacherUnavailableDays: form.teacherUnavailableDays
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean) as CourseOffering["teacherUnavailableDays"],
          requiredFeatures: form.requiredFeatures
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        };

        if (editingId) {
          const updated = await apiClient.updateCourseOffering(editingId, payload);
          setOfferings((current) =>
            current.map((offering) => (offering.id === editingId ? updated : offering)),
          );
        } else {
          const created = await apiClient.createCourseOffering(payload);
          setOfferings((current) => [...current, created]);
        }

        resetForm();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to save course offering.",
        );
      }
    });
  }

  function handleEdit(offering: CourseOffering) {
    setEditingId(offering.id);
    setForm({
      title: offering.title,
      teacher: offering.teacherId,
      batch: offering.sectionId,
      dayCode: offering.dayCode,
      startTime: offering.startTime.slice(0, 5),
      endTime: offering.endTime.slice(0, 5),
      requiredCapacity: String(offering.requiredCapacity),
      requiredRoomType: offering.requiredRoomType,
      priorityScore: String(offering.priorityScore),
      isLocked: offering.isLocked,
      teacherUnavailableDays: offering.teacherUnavailableDays.join(", "),
      requiredFeatures: offering.requiredFeatures.join(", "),
    });
  }

  function handleDelete(offeringId: string) {
    setError(null);

    startTransition(async () => {
      try {
        await apiClient.deleteCourseOffering(offeringId);
        setOfferings((current) => current.filter((offering) => offering.id !== offeringId));
        if (editingId === offeringId) {
          resetForm();
        }
      } catch (deleteError) {
        setError(
          deleteError instanceof Error ? deleteError.message : "Failed to delete course offering.",
        );
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <h2 className="text-2xl font-semibold text-stone-50">
          {editingId ? "Edit course offering" : "Add course offering"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-stone-300">
          Define sessions, timetable constraints, room requirements, and academic priority.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-stone-200">
            Subject / title
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-stone-200">
              Teacher
              <input
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                value={form.teacher}
                onChange={(event) =>
                  setForm((current) => ({ ...current, teacher: event.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-stone-200">
              Batch / section
              <input
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                value={form.batch}
                onChange={(event) =>
                  setForm((current) => ({ ...current, batch: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-stone-200">
              Day
              <select
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
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
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startTime: event.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-stone-200">
              End
              <input
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endTime: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-stone-200">
              Required capacity
              <input
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                type="number"
                min="0"
                value={form.requiredCapacity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, requiredCapacity: event.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-stone-200">
              Room type
              <select
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                value={form.requiredRoomType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requiredRoomType: event.target.value as CourseOffering["requiredRoomType"],
                  }))
                }
              >
                <option value="ANY">ANY</option>
                <option value="THEORY">THEORY</option>
                <option value="LAB">LAB</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-stone-200">
              Priority
              <input
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                type="number"
                min="1"
                value={form.priorityScore}
                onChange={(event) =>
                  setForm((current) => ({ ...current, priorityScore: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-stone-200">
            Teacher unavailable days
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.teacherUnavailableDays}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  teacherUnavailableDays: event.target.value,
                }))
              }
              placeholder="FRI, SAT"
            />
          </label>

          <label className="grid gap-2 text-sm text-stone-200">
            Required room features
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.requiredFeatures}
              onChange={(event) =>
                setForm((current) => ({ ...current, requiredFeatures: event.target.value }))
              }
              placeholder="projector, smart board"
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-stone-200">
            <input
              type="checkbox"
              checked={form.isLocked}
              onChange={(event) =>
                setForm((current) => ({ ...current, isLocked: event.target.checked }))
              }
            />
            Locked session
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {editingId ? "Save course" : "Create course"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-stone-500 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
        <h2 className="text-2xl font-semibold text-stone-50">Course offerings</h2>
        <div className="mt-5 grid gap-3">
          {offerings.map((offering) => (
            <article
              key={offering.id}
              className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-stone-50">{offering.title}</p>
                  <p className="mt-1 text-sm text-stone-300">
                    {offering.sectionId} • {offering.dayCode} • {offering.startTime}-
                    {offering.endTime}
                  </p>
                  <p className="mt-1 text-sm text-stone-400">
                    {offering.requiredRoomType} • Priority {offering.priorityScore}
                    {offering.isLocked ? " • Locked" : ""}
                  </p>
                  <p className="mt-2 text-sm text-stone-400">
                    Features:{" "}
                    {offering.requiredFeatures.length > 0
                      ? offering.requiredFeatures.join(", ")
                      : "Standard room"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(offering)}
                    className="rounded-full border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(offering.id)}
                    disabled={isPending}
                    className="rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
