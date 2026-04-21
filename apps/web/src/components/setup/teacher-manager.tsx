"use client";

import { useState, useTransition } from "react";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { CsvImportPanel } from "@/components/setup/csv-import-panel";
import type { Teacher } from "@/types/domain";

const apiClient = new SchedulerApiClient();

interface TeacherManagerProps {
  initialTeachers: Teacher[];
}

export function TeacherManager({ initialTeachers }: TeacherManagerProps) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    department: "",
    maxDailyLoad: "4",
    unavailableDayCodes: "",
  });

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      department: "",
      maxDailyLoad: "4",
      unavailableDayCodes: "",
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          department: form.department,
          maxDailyLoad: Number(form.maxDailyLoad),
          unavailableDayCodes: form.unavailableDayCodes
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean) as Teacher["unavailableDayCodes"],
        };

        if (editingId) {
          const updated = await apiClient.updateTeacher(editingId, payload);
          setTeachers((current) => current.map((item) => (item.id === editingId ? updated : item)));
        } else {
          const created = await apiClient.createTeacher(payload);
          setTeachers((current) => [...current, created]);
        }

        resetForm();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error ? submissionError.message : "Failed to save teacher.",
        );
      }
    });
  }

  function handleEdit(teacher: Teacher) {
    setEditingId(teacher.id);
    setForm({
      name: teacher.name,
      department: teacher.department,
      maxDailyLoad: String(teacher.maxDailyLoad),
      unavailableDayCodes: teacher.unavailableDayCodes.join(", "),
    });
  }

  function handleDelete(teacherId: string) {
    setError(null);

    startTransition(async () => {
      try {
        await apiClient.deleteTeacher(teacherId);
        setTeachers((current) => current.filter((item) => item.id !== teacherId));
        if (editingId === teacherId) {
          resetForm();
        }
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Failed to delete teacher.");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <CsvImportPanel
        title="Import faculty availability from CSV"
        description="Bulk upload faculty records from an academic planning spreadsheet. Existing teachers are matched by name so updates refresh department and availability metadata cleanly."
        expectedHeaders={["name", "department", "max_daily_load", "unavailable_days"]}
        onImportComplete={async (file) => {
          const result = await apiClient.uploadTeachersCsv(file);
          const refreshedTeachers = await apiClient.getTeachers();
          setTeachers(refreshedTeachers);
          resetForm();
          return `Imported faculty registry: ${result.created} created, ${result.updated} updated.`;
        }}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <h2 className="text-2xl font-semibold text-stone-50">
          {editingId ? "Edit teacher" : "Add teacher"}
        </h2>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-stone-200">
            Name
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label className="grid gap-2 text-sm text-stone-200">
            Department
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.department}
              onChange={(event) =>
                setForm((current) => ({ ...current, department: event.target.value }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm text-stone-200">
            Max daily load
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              type="number"
              min="1"
              value={form.maxDailyLoad}
              onChange={(event) =>
                setForm((current) => ({ ...current, maxDailyLoad: event.target.value }))
              }
              required
            />
          </label>
          <label className="grid gap-2 text-sm text-stone-200">
            Unavailable days
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.unavailableDayCodes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unavailableDayCodes: event.target.value,
                }))
              }
              placeholder="FRI, SAT"
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {editingId ? "Save teacher" : "Create teacher"}
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
        <h2 className="text-2xl font-semibold text-stone-50">Teacher registry</h2>
        <div className="mt-5 grid gap-3">
          {teachers.map((teacher) => (
            <article
              key={teacher.id}
              className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-stone-50">{teacher.name}</p>
                  <p className="mt-1 text-sm text-stone-300">{teacher.department || "General"}</p>
                  <p className="mt-1 text-sm text-stone-400">
                    Max daily load {teacher.maxDailyLoad}
                  </p>
                  <p className="mt-2 text-sm text-stone-400">
                    {teacher.unavailableDayCodes.length > 0
                      ? teacher.unavailableDayCodes.join(", ")
                      : "Fully available"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(teacher)}
                    className="rounded-full border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(teacher.id)}
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
    </div>
  );
}
