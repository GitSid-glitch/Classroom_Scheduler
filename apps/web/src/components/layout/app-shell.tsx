import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppNavigation } from "@/components/layout/app-navigation";
import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { getCurrentIdentity } from "@/lib/auth/server-session";

const apiClient = new SchedulerApiClient();

interface AppShellProps {
  title: string;
  eyebrow: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export async function AppShell({ title, eyebrow, description, actions, children }: AppShellProps) {
  const [identity, terms] = await Promise.all([
    getCurrentIdentity(),
    apiClient.listAcademicTerms().catch(() => []),
  ]);
  const displayName = identity?.displayName;
  const currentTerm = terms.find((term) => term.is_current);
  const homeHref = identity?.role === "FACULTY"
    ? "/portal/faculty"
    : identity?.role === "STUDENT" ? "/portal/student" : "/dashboard";

  return (
    <div className="app-layout flex flex-col lg:flex-row">
      <aside className="app-sidebar sticky top-0 z-20 flex h-auto flex-col border-b border-stone-800 bg-white lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:px-6">
          <Link href={homeHref} className="flex items-center gap-3" aria-label="Smart Scheduler home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#17665b] text-xs font-bold tracking-wide text-white shadow-sm">SS</span>
            <span className="block">
              <span className="block text-sm font-semibold tracking-tight text-stone-50">Smart Scheduler</span>
              <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">Academic operations</span>
            </span>
          </Link>
          <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 lg:inline-flex">WORKSPACE</span>
        </div>

        <div className="hidden border-y border-stone-800 px-5 py-3 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Schedule scope</p>
          <p className="mt-1 text-xs font-semibold text-stone-100">{currentTerm?.name ?? "Term not available"}</p>
        </div>

        <div className="overflow-x-auto lg:flex-1 lg:overflow-y-auto">
          <div className="min-w-[720px] lg:min-w-0">
            <AppNavigation role={identity?.role ?? null} />
          </div>
        </div>

        <div className="hidden border-t border-stone-800 p-4 lg:block">
          <div className="flex items-center gap-3 rounded-xl bg-stone-900 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#dceee8] text-xs font-bold text-[#17665b]">
              {(displayName?.slice(0, 1) ?? "C").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-stone-100">{displayName ?? "Coordinator demo"}</p>
              <p className="mt-0.5 text-[10px] text-stone-400">{identity?.role ?? "Workspace preview"}</p>
            </div>
            {identity ? <LogoutButton /> : null}
          </div>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="app-main">
        <header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between border-b border-stone-800 bg-white/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
          <div className="min-w-0 flex items-center gap-3 text-xs text-stone-400">
            <span className="hidden sm:inline">Academic operations</span><span className="hidden sm:inline" aria-hidden="true">/</span><span className="truncate font-medium text-stone-200">{eyebrow}</span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-[#f2f5f3] px-3 py-1.5 text-[11px] font-medium text-stone-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#96a69e]" /> Demo workspace
            </span>
            {actions}
            {identity ? <span className="lg:hidden"><LogoutButton /></span> : null}
          </div>
        </header>

        <div className="app-page-content mx-auto flex w-full max-w-[1480px] flex-col gap-7 px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#17665b]">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-stone-50 sm:text-[34px]">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">{description}</p>
            </div>
          </section>
          {children}
          <footer className="mt-2 flex flex-col gap-2 border-t border-stone-800 py-5 text-[11px] text-stone-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Smart Scheduler · Academic operations workspace</span>
            <span>Constraint-aware scheduling · Groq request planning</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
