"use client";

import { useRef, useState, useTransition } from "react";

interface CsvImportPanelProps {
  title: string;
  description: string;
  expectedHeaders: string[];
  onImportComplete: (file: File) => Promise<string>;
}

export function CsvImportPanel({
  title,
  description,
  expectedHeaders,
  onImportComplete,
}: CsvImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const summary = await onImportComplete(file);
        setMessage(summary);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Failed to import CSV.");
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-dashed border-amber-300/30 bg-amber-300/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
            Bulk Import
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-50">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-stone-300">{description}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-400">
            Expected headers
          </p>
          <p className="mt-2 text-sm text-stone-200">{expectedHeaders.join(", ")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200">
            {isPending ? "Importing..." : "Upload CSV"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={isPending}
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}
