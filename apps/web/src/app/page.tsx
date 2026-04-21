import { Hero } from "@/components/home/hero";
import { HighlightCards } from "@/components/home/highlight-cards";
import { PlatformGrid } from "@/components/home/platform-grid";
import { DashboardService } from "@/lib/services/dashboard-service";

const dashboardService = new DashboardService();

export default function Home() {
  const summary = dashboardService.getPortfolioSummary();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-20 px-6 py-10 sm:px-10 lg:px-12">
      <Hero />

      <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur md:grid-cols-4">
        <div>
          <p className="text-sm text-stone-400">Academic Spaces</p>
          <p className="mt-2 text-3xl font-semibold text-stone-50">{summary.roomCount}</p>
        </div>
        <div>
          <p className="text-sm text-stone-400">Faculty Constraints</p>
          <p className="mt-2 text-3xl font-semibold text-stone-50">{summary.teacherCount}</p>
        </div>
        <div>
          <p className="text-sm text-stone-400">Sections In Scope</p>
          <p className="mt-2 text-3xl font-semibold text-stone-50">{summary.sectionCount}</p>
        </div>
        <div>
          <p className="text-sm text-stone-400">Draft Offerings</p>
          <p className="mt-2 text-3xl font-semibold text-stone-50">{summary.offeringCount}</p>
        </div>
      </section>

      <PlatformGrid />
      <HighlightCards />
    </main>
  );
}
