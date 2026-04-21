interface StatusBoardProps {
  scheduledCount: number;
  totalCount: number;
  minRooms: number;
  maxValue: number;
}

export function StatusBoard({
  scheduledCount,
  totalCount,
  minRooms,
  maxValue,
}: StatusBoardProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
        <p className="text-sm text-emerald-100">Scheduled Sessions</p>
        <p className="mt-3 text-3xl font-semibold text-white">{scheduledCount}</p>
        <p className="mt-2 text-sm text-emerald-100/90">Out of {totalCount} tracked offerings</p>
      </article>
      <article className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-5">
        <p className="text-sm text-amber-100">Unscheduled Queue</p>
        <p className="mt-3 text-3xl font-semibold text-white">{totalCount - scheduledCount}</p>
        <p className="mt-2 text-sm text-amber-100/90">These need manual review or better constraints</p>
      </article>
      <article className="rounded-[1.5rem] border border-sky-300/20 bg-sky-300/10 p-5">
        <p className="text-sm text-sky-100">Minimum Rooms Used</p>
        <p className="mt-3 text-3xl font-semibold text-white">{minRooms}</p>
        <p className="mt-2 text-sm text-sky-100/90">Derived from the current scheduling run</p>
      </article>
      <article className="rounded-[1.5rem] border border-fuchsia-300/20 bg-fuchsia-300/10 p-5">
        <p className="text-sm text-fuchsia-100">Draft Utility Score</p>
        <p className="mt-3 text-3xl font-semibold text-white">{maxValue}</p>
        <p className="mt-2 text-sm text-fuchsia-100/90">A proxy for academic value captured</p>
      </article>
    </section>
  );
}
