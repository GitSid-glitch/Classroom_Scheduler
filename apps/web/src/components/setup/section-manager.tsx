"use client";

import { useState, useTransition } from "react";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import type { Section } from "@/types/domain";

const apiClient = new SchedulerApiClient();

interface SectionManagerProps {
  initialSections: Section[];
}

export function SectionManager({ initialSections }: SectionManagerProps) {
  const [sections, setSections] = useState(initialSections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    program: "",
    semester: "1",
    size: "0",
  });

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      program: "",
      semester: "1",
      size: "0",
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          program: form.program,
          semester: Number(form.semester),
          size: Number(form.size),
        };

        if (editingId) {
          const updated = await apiClient.updateSection(editingId, payload);
          setSections((current) => current.map((item) => (item.id === editingId ? updated : item)));
        } else {
          const created = await apiClient.createSection(payload);
          setSections((current) => [...current, created]);
        }

        resetForm();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error ? submissionError.message : "Failed to save section.",
        );
      }
    });
  }

  function handleEdit(section: Section) {
    setEditingId(section.id);
    setForm({
      name: section.name,
      program: section.program,
      semester: String(section.semester),
      size: String(section.size),
    });
  }

  function handleDelete(sectionId: string) {
    setError(null);

    startTransition(async () => {
      try {
        await apiClient.deleteSection(sectionId);
        setSections((current) => current.filter((item) => item.id !== sectionId));
        if (editingId === sectionId) {
          resetForm();
        }
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Failed to delete section.");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <h2 className="text-2xl font-semibold text-stone-50">
          {editingId ? "Edit section" : "Add section"}
        </h2>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-stone-200">
            Section name
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label className="grid gap-2 text-sm text-stone-200">
            Program
            <input
              className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
              value={form.program}
              onChange={(event) =>
                setForm((current) => ({ ...current, program: event.target.value }))
              }
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-stone-200">
              Semester
              <input
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                type="number"
                min="1"
                value={form.semester}
                onChange={(event) =>
                  setForm((current) => ({ ...current, semester: event.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-stone-200">
              Size
              <input
                className="rounded-2xl border border-stone-600 bg-stone-950 px-4 py-3 text-stone-50"
                type="number"
                min="0"
                value={form.size}
                onChange={(event) =>
                  setForm((current) => ({ ...current, size: event.target.value }))
                }
                required
              />
            </label>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {editingId ? "Save section" : "Create section"}
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
        <h2 className="text-2xl font-semibold text-stone-50">Section registry</h2>
        <div className="mt-5 grid gap-3">
          {sections.map((section) => (
            <article
              key={section.id}
              className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-stone-50">{section.name}</p>
                  <p className="mt-1 text-sm text-stone-300">{section.program || "General"}</p>
                  <p className="mt-1 text-sm text-stone-400">
                    Semester {section.semester} • Size {section.size}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(section)}
                    className="rounded-full border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(section.id)}
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
