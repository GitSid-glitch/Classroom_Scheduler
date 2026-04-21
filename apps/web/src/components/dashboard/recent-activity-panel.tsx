import type { AuditEvent } from "@/types/domain";

interface RecentActivityPanelProps {
  events: AuditEvent[];
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
}

export function RecentActivityPanel({ events }: RecentActivityPanelProps) {
  return (
    <section className="rounded-[2rem] border border-stone-800 bg-stone-950 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-400">
            Audit Trail
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-50">
            Recent operational activity
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-stone-400">
          This gives the product a more real-world operations feel by showing when data and
          schedule lifecycle events changed.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {events.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-stone-700 p-4 text-sm text-stone-400">
            No audit activity has been recorded yet.
          </div>
        ) : null}

        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-[1.25rem] border border-stone-700 bg-stone-900/70 p-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-stone-50">{event.summary}</p>
                <p className="mt-1 text-sm text-stone-400">
                  {event.action} • {event.entityType.replaceAll("_", " ")} #{event.entityId}
                </p>
              </div>
              <span className="rounded-full border border-stone-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-300">
                {formatTimestamp(event.createdAt)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
