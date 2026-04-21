import Link from "next/link";

export function Hero() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
          Next.js + TypeScript + Tailwind + AI Scheduling
        </div>
        <div className="space-y-4">
          <h1 className="max-w-3xl font-serif text-5xl leading-tight text-stone-50 sm:text-6xl">
            Smart academic scheduling for universities that need more than a timetable generator.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-300">
            This product direction combines algorithmic scheduling, coordinator workflows,
            analytics, and AI-assisted decisions into one operational platform.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-amber-300 px-7 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
          >
            Sign In To Platform
          </Link>
          <Link
            href="/published-timetable"
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/40 px-7 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/10"
          >
            Open Published View
          </Link>
          <a
            href="#platform"
            className="inline-flex items-center justify-center rounded-full border border-stone-500 px-7 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300 hover:bg-white/5"
          >
            Explore Platform Scope
          </a>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="grid gap-4">
          <div className="rounded-3xl bg-stone-950/70 p-5">
            <p className="text-sm font-medium text-stone-400">Scheduling Engine</p>
            <p className="mt-2 text-2xl font-semibold text-stone-50">
              Heap + DP today, constraints and AI next
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-sm font-medium text-emerald-100">Institution View</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50/90">
                Rooms, teachers, sections, conflicts, utilization, publish workflow.
              </p>
            </div>
            <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
              <p className="text-sm font-medium text-sky-100">AI Layer</p>
              <p className="mt-2 text-sm leading-6 text-sky-50/90">
                Explain unscheduled sessions, suggest fixes, and assist CSV imports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
