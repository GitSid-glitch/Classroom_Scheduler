import Link from "next/link";

import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col items-center justify-center gap-10 px-6 py-12 sm:px-10 lg:px-12">
      <div className="w-full max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#17665b]">
          Smart Academic Scheduler
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-stone-50 sm:text-5xl">
          Plan a better week for your campus.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-stone-400">
          Sign in to manage academic schedules or view the timetable published for your campus.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="rounded-full border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:border-stone-300 hover:bg-white/5"
          >
            Back to overview
          </Link>
        </div>
      </div>

      <LoginForm />
    </main>
  );
}
