"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/auth/access";

const groups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: "◫" },
      { href: "/published-timetable", label: "Timetable", icon: "▦" },
      { href: "/portal/student", label: "Student portal", icon: "♧" },
      { href: "/portal/faculty", label: "Faculty portal", icon: "♙" },
      { href: "/scheduler/run", label: "Scheduling", icon: "✳" },
      { href: "/scheduler/conflicts", label: "Conflict review", icon: "◇" },
    ],
  },
  {
    label: "Institution",
    items: [
      { href: "/setup/courses", label: "Course offerings", icon: "▤" },
      { href: "/setup/terms", label: "Academic terms", icon: "◷" },
      { href: "/setup/sections", label: "Sections", icon: "⊞" },
      { href: "/setup/teachers", label: "Faculty", icon: "♙" },
      { href: "/setup/rooms", label: "Rooms", icon: "⌂" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/analytics", label: "Insights", icon: "⌁" },
      { href: "/ai-assistant", label: "AI assistant", icon: "✧" },
    ],
  },
];

export function AppNavigation({ role }: { role: AppRole | null }) {
  const pathname = usePathname();
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === "/portal/student") return role === "STUDENT";
        if (item.href === "/portal/faculty") return role === "FACULTY";
        if (item.href === "/published-timetable") return true;
        if (role === "ADMIN") return true;
        return role === "COORDINATOR" && group.label !== "Institution";
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Primary navigation" className="space-y-7 px-3 py-5">
      {visibleGroups.map((group) => (
        <div key={group.label} className="app-nav-group">
          <p className="app-nav-group-label px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
            {group.label}
          </p>
          <div className="app-nav-items space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  className="app-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-stone-300"
                >
                  <span aria-hidden="true" className="grid h-5 w-5 place-items-center text-[16px] text-stone-400">
                    {item.icon}
                  </span>
                  {item.label}
                  {item.href === "/scheduler/conflicts" ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
