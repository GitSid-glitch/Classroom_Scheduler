"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunScheduleButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDraft() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/schedules/run", { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to generate a schedule.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to generate a schedule.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={generateDraft} disabled={pending} aria-busy={pending} className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold disabled:cursor-wait disabled:opacity-60">
        {pending ? <><span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Generating…</> : <>Generate draft <span aria-hidden="true">✳</span></>}
      </button>
      {error ? <p role="alert" className="max-w-64 text-right text-[10px] text-rose-700">{error}</p> : null}
    </div>
  );
}
