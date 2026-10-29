import Link from "next/link";
import type { Metadata } from "next";

import { Hero } from "@/components/home/hero";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";

export const metadata: Metadata = { title: "Home" };

const apiClient = new SchedulerApiClient();

const capabilities = [
  { number: "01", title: "Plan around real constraints", detail: "Keep room capacity, faculty availability, fixed sessions and equipment requirements in view from the first draft." },
  { number: "02", title: "Review before you publish", detail: "Compare coverage, surface unresolved conflicts and make a deliberate release with a clear audit trail." },
  { number: "03", title: "Understand every trade-off", detail: "Use scheduling explanations and evidence-grounded recommendations to decide what to adjust next." },
];

export default async function Home() {
  const [roomsResult, teachersResult, sectionsResult, offeringsResult] = await Promise.allSettled([
    apiClient.getRooms(),
    apiClient.getTeachers(),
    apiClient.getSections(),
    apiClient.getCourseOfferings(),
  ]);
  const inventory = [
    ["Academic spaces", roomsResult.status === "fulfilled" ? roomsResult.value.length : "—"],
    ["Faculty members", teachersResult.status === "fulfilled" ? teachersResult.value.length : "—"],
    ["Sections", sectionsResult.status === "fulfilled" ? sectionsResult.value.length : "—"],
    ["Course offerings", offeringsResult.status === "fulfilled" ? offeringsResult.value.length : "—"],
  ];

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen">
      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Smart Scheduler home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17665b] text-[10px] font-bold tracking-wide text-white">SS</span>
          <span className="text-sm font-semibold tracking-tight text-[#142622]">Smart Scheduler</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/published-timetable" className="hidden rounded-xl px-4 py-2.5 text-xs font-semibold text-[#4f625c] transition hover:bg-white sm:inline-flex">Published timetable</Link>
          <Link href="/login" className="rounded-xl border border-[#dce6e1] bg-white px-4 py-2.5 text-xs font-semibold text-[#243a34] shadow-sm transition hover:border-[#b9cec5]">Sign in <span aria-hidden="true">→</span></Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:px-10 lg:pt-20">
        <Hero />

        <section className="mt-16 grid grid-cols-2 gap-3 rounded-2xl border border-[#e1ebe6] bg-white p-4 shadow-sm sm:grid-cols-4 sm:gap-6 sm:p-6">
          {inventory.map(([label, value]) => <div key={label} className="px-2 py-2 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#5f7069]">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#142622]">{value}<span className="ml-2 text-xs font-normal text-[#5f7069]">in workspace</span></p>
          </div>)}
        </section>

        <section className="mt-20 grid gap-9 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#17665b]">Built for the whole workflow</p>
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-[-.04em] text-[#142622]">A clear path from course data to campus-ready schedules.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#5f7069]">Purpose-built tools help academic teams spend less time untangling spreadsheets and more time improving the student week.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {capabilities.map((item) => <article key={item.number} className="rounded-2xl border border-[#e1ebe6] bg-white p-5 shadow-sm">
              <span className="text-[10px] font-semibold tracking-[.14em] text-[#17665b]">{item.number}</span>
              <h3 className="mt-5 text-sm font-semibold leading-5 text-[#243a34]">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#5f7069]">{item.detail}</p>
            </article>)}
          </div>
        </section>

        <section className="mt-16 flex flex-col gap-5 rounded-2xl bg-[#163e36] px-6 py-7 text-white sm:flex-row sm:items-center sm:justify-between sm:px-9">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a9d5c8]">Coordinator workspace</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Bring the next schedule into focus.</h2>
            <p className="mt-1 text-xs text-white/70">A practical toolkit for academic planning, review and release.</p>
          </div>
          <Link href="/dashboard" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-[#163e36] transition hover:bg-[#eff6f3]">Explore workspace <span aria-hidden="true">→</span></Link>
        </section>

        <footer className="mt-12 flex flex-col gap-2 border-t border-[#e1ebe6] pt-5 text-[10px] text-[#5f7069] sm:flex-row sm:justify-between">
          <span>© Smart Scheduler · Academic operations</span><span>Built with Next.js, React, TypeScript and open-source tools.</span>
        </footer>
      </div>
    </main>
  );
}
