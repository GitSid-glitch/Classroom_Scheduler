"use client";

import { useId, useRef, useState, useTransition } from "react";
import { SchedulerApiError } from "@/lib/api/scheduler-api-client";

interface CsvImportPanelProps {
  title: string;
  description: string;
  expectedHeaders: string[];
  requiredHeaders?: string[];
  onImportComplete: (
    file: File,
    dryRun: boolean,
    headerMapping: Record<string, string>,
  ) => Promise<string>;
}

interface CsvPreview {
  headers: string[];
  rows: string[][];
  errors: string[];
  rowCount: number;
}

interface CsvImportIssue {
  row: number;
  field: string;
  message: string;
}

function extractImportIssues(error: unknown): CsvImportIssue[] {
  if (!(error instanceof SchedulerApiError) || !error.payload || typeof error.payload !== "object") return [];
  const rows = (error.payload as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const rowIssue = item as { row?: unknown; errors?: unknown };
    if (typeof rowIssue.row !== "number" || !rowIssue.errors || typeof rowIssue.errors !== "object") return [];

    return Object.entries(rowIssue.errors as Record<string, unknown>).flatMap(([field, value]) => {
      const messages = flattenMessages(value);
      return messages.map((message) => ({ row: rowIssue.row as number, field, message }));
    });
  });
}

function flattenMessages(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenMessages);
  if (value && typeof value === "object") return Object.values(value).flatMap(flattenMessages);
  return [];
}

function csvCell(value: string) {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function downloadIssues(file: File, issues: CsvImportIssue[]) {
  const report = [
    ["row", "field", "issue"],
    ...issues.map(({ row, field, message }) => [String(row), field, message]),
  ].map((record) => record.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${report}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  const baseName = file.name.replace(/\.csv$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "-") || "import";
  link.href = url;
  link.download = `${baseName}-validation-errors.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const headerAliases: Record<string, string[]> = {
  name: ["room", "room_name", "teacher", "teacher_name", "faculty", "faculty_name", "section", "section_name", "cohort"],
  capacity: ["seats", "room_capacity", "max_capacity"],
  room_type: ["type", "room_category", "space_type"],
  features: ["equipment", "amenities", "room_features"],
  department: ["faculty_department"],
  max_daily_load: ["daily_limit", "max_classes_per_day"],
  unavailable_days: ["unavailable", "days_unavailable", "no_teaching_days"],
  program: ["degree", "course_of_study"],
  semester: ["term_number", "year_of_study"],
  size: ["students", "enrollment", "enrolment", "cohort_size"],
  subject: ["course", "course_name", "course_title", "title", "class_name"],
  teacher: ["faculty", "faculty_name", "instructor", "instructor_name"],
  batch: ["section", "section_name", "student_group", "cohort"],
  day_of_week: ["day", "weekday", "day_code"],
  start_time: ["start", "starts_at", "from", "begin"],
  end_time: ["end", "ends_at", "to", "finish"],
  required_capacity: ["class_size", "enrollment", "enrolment", "students", "batch_size"],
  required_type: ["requested_room_type", "room_type", "space_type"],
  value: ["priority", "priority_score", "weight", "score"],
  teacher_unavailable_days: ["faculty_unavailable_days", "teacher_days_off"],
  is_locked: ["locked", "fixed", "protected"],
  required_features: ["required_equipment", "required_amenities", "needs"],
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("A quoted value is missing its closing quote.");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  return rows;
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function inspectCsv(text: string): CsvPreview {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { headers: [], rows: [], rowCount: 0, errors: ["The file has no header row."] };
  }

  const headers = rows[0].map(normalizeHeader);
  const errors: string[] = [];
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicates.length > 0) errors.push(`Duplicate columns: ${[...new Set(duplicates)].join(", ")}.`);

  const dataRows = rows.slice(1);
  const wrongColumnCount = dataRows.findIndex((values) => values.length !== headers.length);
  if (wrongColumnCount >= 0) {
    errors.push(`Row ${wrongColumnCount + 2} has a different number of values than the header row.`);
  }

  return { headers, rows: dataRows, rowCount: dataRows.length, errors };
}

function suggestHeaderMapping(expectedHeaders: string[], sourceHeaders: string[]) {
  const normalizedSources = sourceHeaders.map(normalizeHeader);
  return Object.fromEntries(expectedHeaders.map((expected) => {
    const candidates = [expected, ...(headerAliases[expected] ?? [])].map(normalizeHeader);
    const sourceIndex = normalizedSources.findIndex((source) => candidates.includes(source));
    return [expected, sourceIndex >= 0 ? sourceHeaders[sourceIndex] : ""];
  }));
}

function getMappingErrors(
  expectedHeaders: string[],
  requiredHeaders: string[],
  mapping: Record<string, string>,
) {
  const errors = requiredHeaders
    .filter((header) => !mapping[header])
    .map((header) => `Choose a source column for required field “${header}”.`);
  const selectedSources = expectedHeaders.map((header) => mapping[header]).filter(Boolean);
  if (new Set(selectedSources).size !== selectedSources.length) {
    errors.push("A source column is mapped more than once. Choose a different source for each field.");
  }
  return errors;
}

function mappedSampleRows(preview: CsvPreview, expectedHeaders: string[], mapping: Record<string, string>) {
  return preview.rows.slice(0, 5).map((row) => expectedHeaders.map((target) => {
    const sourceIndex = preview.headers.indexOf(mapping[target] ?? "");
    return sourceIndex < 0 ? "" : row[sourceIndex] ?? "";
  }));
}

export function CsvImportPanel({
  title,
  description,
  expectedHeaders,
  requiredHeaders = expectedHeaders,
  onImportComplete,
}: CsvImportPanelProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importIssues, setImportIssues] = useState<CsvImportIssue[]>([]);
  const [isPending, startTransition] = useTransition();
  const mappingErrors = getMappingErrors(expectedHeaders, requiredHeaders, mapping);
  const canValidate = Boolean(selectedFile && preview && preview.errors.length === 0 && mappingErrors.length === 0 && preview.rowCount > 0);

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPreview(null);
    setMapping({});
    setValidated(false);
    setMessage(null);
    setError(null);
    setImportIssues([]);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setPreview({ headers: [], rows: [], rowCount: 0, errors: ["Choose a .csv file."] });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPreview({ headers: [], rows: [], rowCount: 0, errors: ["CSV files must be 10 MB or smaller."] });
      return;
    }

    try {
      const inspected = inspectCsv(await file.text());
      setPreview(inspected);
      setMapping(suggestHeaderMapping(expectedHeaders, inspected.headers));
    } catch (parseError) {
      setPreview({
        headers: [],
        rows: [],
        rowCount: 0,
        errors: [parseError instanceof Error ? parseError.message : "The CSV could not be parsed."],
      });
    }
  }

  function submitImport() {
    if (!selectedFile || !preview || !canValidate) return;
    const dryRun = !validated;
    setError(null);
    setMessage(null);
    setImportIssues([]);
    startTransition(async () => {
      try {
        const resultMessage = await onImportComplete(selectedFile, dryRun, mapping);
        if (dryRun) {
          setValidated(true);
          setMessage(resultMessage);
          return;
        }

        setSelectedFile(null);
        setPreview(null);
        setMapping({});
        setValidated(false);
        setMessage(resultMessage);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (uploadError) {
        setImportIssues(extractImportIssues(uploadError));
        setError(uploadError instanceof Error ? uploadError.message : "Failed to validate the CSV.");
      }
    });
  }

  function updateMapping(target: string, source: string) {
    setMapping((current) => ({ ...current, [target]: source }));
    setValidated(false);
    setMessage(null);
    setError(null);
  }

  const sampleRows = preview ? mappedSampleRows(preview, expectedHeaders, mapping) : [];

  return (
    <section className="card-surface p-5 sm:p-6" aria-busy={isPending}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#17665b]">Bulk import</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-50">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">{description}</p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">Expected fields</p>
          <p className="mt-1 text-xs leading-5 text-stone-300">
            {expectedHeaders.map((header) => `${header}${requiredHeaders.includes(header) ? " *" : ""}`).join(", ")}
          </p>
          <p className="mt-1 text-[10px] text-stone-400">* Required · UTF-8 CSV · Maximum 10 MB</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={fileInputId}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#dce6e1] bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 transition hover:border-[#b9cec5] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#17665b]"
          >
            Choose CSV
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={isPending}
              onChange={handleFileSelection}
            />
          </label>
          <button
            type="button"
            onClick={submitImport}
            disabled={!canValidate || isPending}
            className="btn-primary inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (validated ? "Importing…" : "Checking rows…") : validated ? `Import ${preview?.rowCount ?? ""} rows` : `Validate ${preview?.rowCount ?? ""} rows`}
          </button>
        </div>
      </div>

      {selectedFile ? <p className="mt-3 text-xs text-stone-400">Selected: {selectedFile.name}</p> : null}
      {preview?.errors.length ? (
        <div role="alert" className="mt-4 grid gap-1 text-xs text-rose-700">
          {preview.errors.map((item) => <p key={item}>{item}</p>)}
        </div>
      ) : null}

      {preview && preview.headers.length > 0 ? (
        <div className="mt-4 rounded-xl border border-[#e1ebe6] bg-[#fbfcfb] p-4">
          <h3 className="text-sm font-semibold text-stone-800">Match your columns</h3>
          <p className="mt-1 text-xs leading-5 text-stone-500">We guessed common names where possible. Review the matches before validating the file.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expectedHeaders.map((target) => (
              <label key={target} className="grid gap-1.5 text-xs font-medium text-stone-700">
                {target}{requiredHeaders.includes(target) ? " *" : ""}
                <select
                  className="field-control px-3 py-2 text-sm"
                  value={mapping[target] ?? ""}
                  disabled={isPending}
                  onChange={(event) => updateMapping(target, event.target.value)}
                >
                  <option value="">Not provided</option>
                  {preview.headers.map((header, index) => (
                    <option key={`${header}-${index}`} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {mappingErrors.length > 0 ? (
            <div className="mt-3 grid gap-1 text-xs text-amber-800" role="status">
              {mappingErrors.map((item) => <p key={item}>{item}</p>)}
            </div>
          ) : null}

          {preview.rowCount > 0 ? (
            <>
              <p className="mt-5 text-xs font-semibold text-stone-800">Mapped preview · {preview.rowCount} data rows</p>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-[11px]">
                  <caption className="sr-only">First five rows after applying the selected column mapping</caption>
                  <thead>
                    <tr>{expectedHeaders.slice(0, 6).map((header) => <th key={header} scope="col" className="border-b border-[#e1ebe6] px-2 py-2 font-semibold text-stone-500">{header}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.slice(0, 6).map((value, columnIndex) => <td key={`${rowIndex}-${columnIndex}`} className="max-w-56 truncate border-b border-[#edf1ee] px-2 py-2 text-stone-700">{value || "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[10px] leading-5 text-stone-500">Server validation checks every row, including field rules and existing records. The validation step makes no changes; import rechecks all rows before saving them atomically.</p>
            </>
          ) : null}
        </div>
      ) : null}

      {message ? <p role="status" className="mt-4 text-sm font-medium text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p> : null}
      {importIssues.length > 0 && selectedFile ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-xs text-stone-500">{importIssues.length} row-level issue{importIssues.length === 1 ? "" : "s"} found.</p>
          <button
            type="button"
            className="rounded-lg border border-[#dce6e1] bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-[#b9cec5]"
            onClick={() => downloadIssues(selectedFile, importIssues)}
          >
            Download error report
          </button>
        </div>
      ) : null}
    </section>
  );
}
