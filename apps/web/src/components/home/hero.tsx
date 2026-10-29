import Link from "next/link";

const previewClasses = [
  { day: "MON", time: "09:00", name: "Data Structures", room: "A-101", tint: "bg-[#e7f3ef] text-[#14584f]" },
  { day: "TUE", time: "11:00", name: "Machine Learning Lab", room: "Lab-204", tint: "bg-[#eef1fb] text-[#45538b]" },
  { day: "WED", time: "10:00", name: "AI Systems Design", room: "B-202", tint: "bg-[#f4efe5] text-[#84663a]" },
];

export function Hero() {
  return (
    <section className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe3dc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#17665b] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#279079]" /> UNIVERSITY SCHEDULING, REIMAGINED
        </div>
        <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[1.06] tracking-[-.055em] text-[#142622] sm:text-[60px]">
          Timetables that work for everyone.
        </h1>
        <p className="mt-5 max-w-lg text-[16px] leading-7 text-[#64756f]">
          Plan academic schedules with real constraints, resolve conflicts with confidence, and publish a timetable your whole campus can trust.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm">
            Open workspace <span aria-hidden="true">→</span>
          </Link>
          <Link href="/published-timetable" className="inline-flex items-center rounded-xl border border-[#dce6e1] bg-white px-5 py-3 text-sm font-semibold text-[#243a34] transition hover:bg-[#f6faf8]">
            View timetable
          </Link>
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#5f7069]">
          <span className="inline-flex items-center gap-2"><span className="text-[#17665b]">✓</span> Constraint-aware</span>
          <span className="inline-flex items-center gap-2"><span className="text-[#17665b]">✓</span> Explainable decisions</span>
          <span className="inline-flex items-center gap-2"><span className="text-[#17665b]">✓</span> Local-first demo</span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-4 rounded-[30px] bg-[#e7f3ef] blur-2xl" aria-hidden="true" />
        <div className="relative overflow-hidden rounded-[22px] border border-[#e1ebe6] bg-white shadow-[0_22px_70px_-38px_rgba(23,69,57,.35)]">
          <div className="flex items-center justify-between border-b border-[#edf1ee] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#5f7069]">Sample timetable</p>
              <p className="mt-1 text-sm font-semibold text-[#243a34]">Illustrative week · Example data</p>
            </div>
            <span className="rounded-full bg-[#eaf4f0] px-3 py-1.5 text-[10px] font-semibold text-[#17665b]">PREVIEW</span>
          </div>
          <div className="grid grid-cols-[62px_repeat(3,minmax(0,1fr))] sm:grid-cols-[78px_repeat(3,minmax(0,1fr))]">
            <div className="border-b border-r border-[#edf1ee] px-2 py-3 text-[9px] font-bold uppercase tracking-wide text-[#a0aaa5] sm:px-4" />
            {["MON", "TUE", "WED"].map((day) => <div key={day} className="border-b border-r border-[#edf1ee] px-2 py-3 text-center text-[9px] font-bold tracking-wide text-[#74837d] last:border-r-0">{day}</div>)}
            {["09:00", "10:00", "11:00", "12:00", "13:00"].map((time, row) => (
              <div key={time} className="contents">
                <div className="min-h-[72px] border-b border-r border-[#edf1ee] px-2 pt-3 text-[9px] font-medium text-[#a0aaa5] sm:px-4">{time}</div>
                {[0, 1, 2].map((col) => {
                  const item = previewClasses.find((item) => item.day === ["MON", "TUE", "WED"][col] && item.time === time);
                  return <div key={`${time}-${col}`} className="min-h-[72px] border-b border-r border-[#edf1ee] p-1.5 last:border-r-0 sm:p-2">
                    {item ? <div className={`h-full min-h-[54px] rounded-lg border-l-2 border-current/40 p-2 ${item.tint}`}>
                      <p className="text-[9px] font-semibold leading-tight sm:text-[10px]">{item.name}</p>
                      <p className="mt-1 text-[8px] opacity-70">{item.room} · 60 min</p>
                    </div> : row === 2 && col === 0 ? <div className="grid h-full min-h-[54px] place-items-center rounded-lg border border-dashed border-[#dce6e1] text-[8px] text-[#9aa7a1]">Open slot</div> : null}
                  </div>;
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between bg-[#fbfcfb] px-5 py-3.5 sm:px-6">
            <p className="text-[10px] text-[#5f7069]">Illustrative schedule entries</p>
            <Link href="/scheduler/conflicts" className="text-[10px] font-semibold text-[#17665b]">Review schedule <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
