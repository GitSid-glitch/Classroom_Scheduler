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
      <article className="rounded-[1.5rem] border border-[#b9d9ce] bg-[#eaf4f0] p-5">
        <p className="text-sm text-[#355a50]">Scheduled Sessions</p>
        <p className="mt-3 text-3xl font-semibold text-[#142622]">{scheduledCount}</p>
        <p className="mt-2 text-sm text-[#355a50]">Out of {totalCount} tracked offerings</p>
      </article>
      <article className="rounded-[1.5rem] border border-[#e4d4a8] bg-[#fff8e6] p-5">
        <p className="text-sm text-[#624d1e]">Unscheduled Queue</p>
        <p className="mt-3 text-3xl font-semibold text-[#142622]">{totalCount - scheduledCount}</p>
        <p className="mt-2 text-sm text-[#624d1e]">These need manual review or better constraints</p>
      </article>
      <article className="rounded-[1.5rem] border border-[#bdd9e6] bg-[#edf7fb] p-5">
        <p className="text-sm text-[#245366]">Minimum Rooms Used</p>
        <p className="mt-3 text-3xl font-semibold text-[#142622]">{minRooms}</p>
        <p className="mt-2 text-sm text-[#245366]">Derived from the current scheduling run</p>
      </article>
      <article className="rounded-[1.5rem] border border-[#d4c4e2] bg-[#f7f1fb] p-5">
        <p className="text-sm text-[#5c3d72]">Draft Utility Score</p>
        <p className="mt-3 text-3xl font-semibold text-[#142622]">{maxValue}</p>
        <p className="mt-2 text-sm text-[#5c3d72]">A proxy for academic value captured</p>
      </article>
    </section>
  );
}
