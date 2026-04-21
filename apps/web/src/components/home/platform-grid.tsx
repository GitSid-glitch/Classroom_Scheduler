const modules = [
  {
    title: "Institution Setup",
    description:
      "Model campuses, buildings, rooms, departments, sections, and course offerings with real academic structure.",
  },
  {
    title: "Constraint Center",
    description:
      "Capture teacher availability, fixed sessions, blackout windows, room features, and section-safe scheduling rules.",
  },
  {
    title: "Draft Scheduler",
    description:
      "Run strategies, compare outputs, inspect unscheduled classes, and lock placements before recalculation.",
  },
  {
    title: "Conflict Review",
    description:
      "Surface teacher overlaps, section collisions, room mismatches, and quality issues in one operational view.",
  },
  {
    title: "Analytics",
    description:
      "Measure room utilization, idle gaps, teacher load balance, and timetable quality across departments.",
  },
  {
    title: "AI Assistant",
    description:
      "Explain decisions, resolve conflicts faster, and turn structured scheduling data into recruiter-visible product depth.",
  },
];

export function PlatformGrid() {
  return (
    <section id="platform" className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200/90">
          Platform Scope
        </p>
        <h2 className="font-serif text-3xl text-stone-50 sm:text-4xl">
          What makes this feel like a real university product
        </h2>
        <p className="max-w-3xl text-base leading-7 text-stone-300">
          The strongest version of this project is not a one-click room allocator. It is a
          system that helps academic operations teams configure constraints, generate drafts,
          review tradeoffs, and publish reliable schedules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <article
            key={module.title}
            className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur"
          >
            <h3 className="text-xl font-semibold text-stone-50">{module.title}</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">{module.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
