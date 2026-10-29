"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PlannedClass = {
  id: number;
  subject: string;
  section: string;
  teacher: string;
  day: string;
  start_time: string;
  end_time: string;
  locked: boolean;
};

type Plan = {
  source: "groq";
  model: string;
  subjects: string[];
  section: string;
  preferred_days: string[];
  time_preference: string;
  clarification: string;
  unmatched_subjects: string[];
  matched_classes: PlannedClass[];
  scheduling_note: string;
};

function timeLabel(value: string) {
  return value.slice(0, 5);
}

async function responsePayload(response: Response) {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return { detail: `The scheduling service returned an unreadable response (${response.status}).` };
  }
}

function responseError(payload: Record<string, unknown>, fallback: string) {
  const detail = payload.error ?? payload.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
}

export function AssistantRequestPlanner() {
  const router = useRouter();
  const [request, setRequest] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function analyze() {
    setBusy(true);
    setError(null);
    setStatus(null);
    setPlan(null);
    try {
      const response = await fetch("/api/backend/schedules/assistant_plan/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      const payload = await responsePayload(response);
      if (!response.ok) throw new Error(responseError(payload, `Could not interpret this request (${response.status}).`));
      const nextPlan = payload as Plan;
      if (!Array.isArray(nextPlan.matched_classes)) throw new Error(responseError(payload, "The assistant returned incomplete schedule matches."));
      setPlan(nextPlan);
      setSelectedIds(nextPlan.matched_classes.map((item) => item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not interpret this schedule request.");
    } finally {
      setBusy(false);
    }
  }

  async function buildDraft() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/backend/schedules/run_request/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_session_ids: selectedIds, name: "AI-assisted draft" }),
      });
      const payload = await responsePayload(response);
      if (!response.ok) throw new Error(responseError(payload, `Could not generate the requested draft (${response.status}).`));
      setStatus(`Draft #${payload.id} generated. Review its placements and conflicts before submitting for approval.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not generate the requested draft.");
    } finally {
      setBusy(false);
    }
  }

  function toggleClass(id: number) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  return (
    <section className="card-surface p-6" aria-labelledby="request-planner-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#17665b]">Describe → review → generate</p>
          <h2 id="request-planner-title" className="mt-2 text-xl font-semibold tracking-tight text-stone-50">Build a draft from a request</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
            Groq extracts subjects and section details. The app matches them against saved offerings; the scheduling engine then applies room, faculty, section and availability rules. Nothing is generated until you review the matches and choose Build draft.
          </p>
        </div>
        <span className="rounded-full border border-[#dceae4] bg-[#f3f8f5] px-3 py-1.5 text-xs font-semibold text-[#17665b]">Groq · configured model</span>
      </div>

      <label htmlFor="schedule-request" className="mt-5 block text-sm font-medium text-stone-200">What do you need in the timetable?</label>
      <textarea
        id="schedule-request"
        value={request}
        onChange={(event) => setRequest(event.target.value)}
        maxLength={3000}
        rows={4}
        placeholder="For example: Create a timetable for B.Tech CSE 4A with Data Structures, Operating Systems, and DBMS. Prefer mornings on Monday and Wednesday."
        className="field-control mt-2 min-h-28 w-full resize-y px-4 py-3 text-sm leading-6"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-500">Your description is sent to the Groq model configured on the API service.</p>
        <button type="button" onClick={analyze} disabled={busy || request.trim().length < 8} className="btn-primary rounded-lg px-4 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          {busy && !plan ? "Analyzing…" : "Extract request"}
        </button>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      {status ? <p role="status" className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{status}</p> : null}

      {plan ? (
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-stone-50">Review extracted request</h3>
              <p className="mt-1 text-xs text-stone-400">Source: Groq · {plan.model}</p>
            </div>
            <button type="button" onClick={buildDraft} disabled={busy || selectedIds.length === 0} className="btn-primary rounded-lg px-4 py-2.5 text-xs font-semibold disabled:opacity-50">
              {busy && plan ? "Building…" : `Build draft from ${selectedIds.length} selected`}
            </button>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3"><dt className="text-[11px] uppercase tracking-wide text-stone-400">Subjects</dt><dd className="mt-1 text-sm text-stone-100">{plan.subjects.join(", ") || "None recognized"}</dd></div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3"><dt className="text-[11px] uppercase tracking-wide text-stone-400">Section</dt><dd className="mt-1 text-sm text-stone-100">{plan.section || "Any matching section"}</dd></div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3"><dt className="text-[11px] uppercase tracking-wide text-stone-400">Preferences found</dt><dd className="mt-1 text-sm text-stone-100">{[...plan.preferred_days, plan.time_preference !== "any" ? plan.time_preference : ""].filter(Boolean).join(" · ") || "No day or time preference"}</dd></div>
          </dl>
          {plan.clarification ? <p className="mt-3 text-sm text-amber-200">Clarification: {plan.clarification}</p> : null}
          {plan.unmatched_subjects.length ? <p className="mt-3 text-sm text-amber-200">Not found in this term’s offerings: {plan.unmatched_subjects.join(", ")}</p> : null}
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{plan.scheduling_note}</p>
          <div className="mt-4 grid gap-2">
            {plan.matched_classes.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleClass(item.id)} className="mt-1 accent-[#17665b]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-100">{item.subject} · {item.section}</span>
                  <span className="mt-1 block text-xs text-stone-400">{item.teacher} · {item.day} {timeLabel(item.start_time)}–{timeLabel(item.end_time)}{item.locked ? " · locked placement" : ""}</span>
                </span>
              </label>
            ))}
            {!plan.matched_classes.length ? <p className="rounded-lg border border-dashed border-stone-700 p-4 text-sm text-stone-400">No offerings matched. Try the exact course or section names from the catalog.</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
