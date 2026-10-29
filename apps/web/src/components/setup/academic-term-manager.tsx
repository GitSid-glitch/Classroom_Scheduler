"use client";

import { useState, useTransition, type FormEvent } from "react";

import { SchedulerApiClient, type AcademicTerm } from "@/lib/api/scheduler-api-client";

const apiClient = new SchedulerApiClient();

interface AcademicTermManagerProps {
  initialTerms: AcademicTerm[];
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export function AcademicTermManager({ initialTerms }: AcademicTermManagerProps) {
  const [terms, setTerms] = useState(initialTerms);
  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartsOn, setEditStartsOn] = useState("");
  const [editEndsOn, setEditEndsOn] = useState("");
  const [sourceTermId, setSourceTermId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentTerm = terms.find((term) => term.is_current);
  const sourceTerms = terms.filter((term) => !term.is_current);

  function createTerm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (startsOn && endsOn && endsOn < startsOn) {
      setError("The end date must be on or after the start date.");
      return;
    }

    startTransition(async () => {
      try {
        const created = await apiClient.createAcademicTerm({
          name: name.trim(),
          starts_on: startsOn || null,
          ends_on: endsOn || null,
        });
        setTerms((current) => [...current, created]);
        setName("");
        setStartsOn("");
        setEndsOn("");
        setMessage(`${created.name} is ready. Activate it when you want to plan its timetable.`);
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Could not create the term.");
      }
    });
  }

  function activateTerm(term: AcademicTerm) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await apiClient.activateAcademicTerm(term.id);
        setTerms((current) => current.map((item) => ({ ...item, is_current: item.id === term.id })));
        setMessage(`${term.name} is now the current term. Scheduling and course setup use this term.`);
      } catch (activateError) {
        setError(activateError instanceof Error ? activateError.message : "Could not activate the term.");
      }
    });
  }

  function beginEdit(term: AcademicTerm) {
    setEditingId(term.id);
    setEditName(term.name);
    setEditStartsOn(term.starts_on ?? "");
    setEditEndsOn(term.ends_on ?? "");
    setError(null);
    setMessage(null);
  }

  function saveTerm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId === null) return;
    setError(null);
    setMessage(null);
    if (editStartsOn && editEndsOn && editEndsOn < editStartsOn) {
      setError("The end date must be on or after the start date.");
      return;
    }

    startTransition(async () => {
      try {
        const updated = await apiClient.updateAcademicTerm(editingId, {
          name: editName.trim(),
          starts_on: editStartsOn || null,
          ends_on: editEndsOn || null,
        });
        setTerms((current) => current.map((term) => term.id === updated.id ? updated : term));
        setEditingId(null);
        setMessage(`${updated.name} has been updated.`);
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Could not update the term.");
      }
    });
  }

  function copyCourses() {
    if (!currentTerm || !sourceTermId) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await apiClient.copyAcademicTermCourses(currentTerm.id, Number(sourceTermId));
        setMessage(`Copied ${result.created} course sessions from ${result.source}; ${result.skipped} existing sessions were skipped.`);
      } catch (copyError) {
        setError(copyError instanceof Error ? copyError.message : "Could not copy course sessions.");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.85fr)]">
      <section className="card-surface p-5 sm:p-6" aria-labelledby="terms-list-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#17665b]">Academic calendar</p>
            <h2 id="terms-list-title" className="mt-2 text-xl font-semibold tracking-tight text-stone-50">Terms in this workspace</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
              Course sessions and generated schedules stay attached to the term they belong to. Changing the current term keeps older schedules in their original scope.
            </p>
          </div>
          <span className="rounded-full bg-[#e7f3ef] px-3 py-1.5 text-xs font-semibold text-[#17665b]">
            {terms.length} {terms.length === 1 ? "term" : "terms"}
          </span>
        </div>

        {terms.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-stone-700 p-4 text-sm text-stone-400">
            No terms are available. Create one to start organizing course sessions and schedules.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {terms.map((term) => (
              <li key={term.id} className="flex flex-col gap-4 rounded-xl border border-stone-800 bg-stone-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-stone-50">{term.name}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${term.is_current ? "bg-emerald-50 text-emerald-800" : "bg-stone-800 text-stone-400"}`}>
                      {term.is_current ? "Current" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-stone-400">
                    {formatDate(term.starts_on)} <span aria-hidden="true">→</span> {formatDate(term.ends_on)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isPending} onClick={() => beginEdit(term)} className="rounded-lg border border-stone-700 bg-white px-3.5 py-2 text-xs font-semibold text-stone-200 disabled:opacity-60">
                    Edit details
                  </button>
                  {!term.is_current ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => activateTerm(term)}
                      className="btn-primary rounded-lg px-3.5 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Make current
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {editingId !== null ? (
          <form onSubmit={saveTerm} className="mt-4 grid gap-3 rounded-xl border border-[#b9cec5] bg-[#f7faf8] p-4">
            <p className="text-sm font-semibold text-stone-100">Edit term details</p>
            <label className="grid gap-2 text-xs font-medium text-stone-300">
              Term name
              <input className="field-control px-3 py-2 text-sm" value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={100} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-medium text-stone-300">Starts on<input className="field-control px-3 py-2 text-sm" type="date" value={editStartsOn} onChange={(event) => setEditStartsOn(event.target.value)} /></label>
              <label className="grid gap-2 text-xs font-medium text-stone-300">Ends on<input className="field-control px-3 py-2 text-sm" type="date" value={editEndsOn} onChange={(event) => setEditEndsOn(event.target.value)} /></label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isPending || !editName.trim()} className="btn-primary rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-60">{isPending ? "Saving…" : "Save changes"}</button>
              <button type="button" disabled={isPending} onClick={() => setEditingId(null)} className="rounded-lg border border-stone-700 bg-white px-3.5 py-2 text-xs font-semibold text-stone-300">Cancel</button>
            </div>
          </form>
        ) : null}
        {currentTerm ? (
          <div className="mt-5 rounded-xl border border-stone-800 bg-stone-900 p-4">
            <h3 className="text-sm font-semibold text-stone-50">Carry course setup forward</h3>
            <p className="mt-1.5 text-xs leading-5 text-stone-400">Copy course sessions from a previous term into {currentTerm.name}. Existing matching sessions are left as they are.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="source-academic-term">Source academic term</label>
              <select id="source-academic-term" className="field-control min-w-0 flex-1 px-3 py-2 text-sm" value={sourceTermId} onChange={(event) => setSourceTermId(event.target.value)} disabled={sourceTerms.length === 0}>
                <option value="">{sourceTerms.length ? "Choose a source term" : "Create another term first"}</option>
                {sourceTerms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
              </select>
              <button type="button" onClick={copyCourses} disabled={isPending || !sourceTermId} className="btn-primary rounded-lg px-3.5 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "Copying…" : "Copy course sessions"}</button>
            </div>
          </div>
        ) : null}
        {message ? <p role="status" className="mt-4 text-sm font-medium text-emerald-800">{message}</p> : null}
        {error ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="card-surface p-5 sm:p-6" aria-labelledby="create-term-title">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#17665b]">Term setup</p>
        <h2 id="create-term-title" className="mt-2 text-xl font-semibold tracking-tight text-stone-50">Add an academic term</h2>
        <p className="mt-2 text-sm leading-6 text-stone-400">Dates are optional. A new term starts inactive, so your current planning scope only changes when you activate it.</p>

        <form onSubmit={createTerm} className="mt-5 grid gap-4">
          <label className="grid gap-2 text-xs font-medium text-stone-300">
            Term name <span className="sr-only">(required)</span>
            <input className="field-control px-3 py-2.5 text-sm" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required placeholder="e.g. Fall 2026" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-medium text-stone-300">
              Starts on
              <input className="field-control px-3 py-2.5 text-sm" type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
            </label>
            <label className="grid gap-2 text-xs font-medium text-stone-300">
              Ends on
              <input className="field-control px-3 py-2.5 text-sm" type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />
            </label>
          </div>
          <button type="submit" disabled={isPending || !name.trim()} className="btn-primary mt-1 w-fit rounded-lg px-4 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60">
            {isPending ? "Saving…" : "Create term"}
          </button>
        </form>
      </section>
    </div>
  );
}
