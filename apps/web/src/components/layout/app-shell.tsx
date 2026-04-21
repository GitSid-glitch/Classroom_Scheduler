import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { canAccessPath, roleLabel } from "@/lib/auth/access";
import { getCurrentIdentity } from "@/lib/auth/server-session";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/setup/rooms", label: "Rooms" },
  { href: "/setup/teachers", label: "Teachers" },
  { href: "/setup/sections", label: "Sections" },
  { href: "/setup/courses", label: "Courses" },
  { href: "/scheduler/run", label: "Scheduler" },
  { href: "/scheduler/conflicts", label: "Conflicts" },
  { href: "/analytics", label: "Analytics" },
  { href: "/ai-assistant", label: "AI Assistant" },
  { href: "/published-timetable", label: "Published" },
];

interface AppShellProps {
  title: string;
  eyebrow: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export async function AppShell({
  title,
  eyebrow,
  description,
  actions,
  children,
}: AppShellProps) {
  const identity = await getCurrentIdentity();
  const role = identity?.role;
  const displayName = identity?.displayName;
  const visibleNavigation = role
    ? navigationItems.filter((item) => canAccessPath(role, item.href))
    : navigationItems;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
      <header className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
              {eyebrow}
            </p>
            <div className="space-y-3">
              <h1 className="font-serif text-4xl text-stone-50 sm:text-5xl">{title}</h1>
              <p className="max-w-3xl text-base leading-8 text-stone-300">{description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {role ? (
              <div className="rounded-full border border-stone-600 px-4 py-2 text-sm text-stone-200">
                {displayName ?? "Signed in"} • {roleLabel(role)}
              </div>
            ) : null}
            {actions}
            {role ? <LogoutButton /> : null}
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-3">
          {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:border-stone-300 hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </main>
  );
}
