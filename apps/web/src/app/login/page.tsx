import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col items-center justify-center gap-10 px-6 py-12 sm:px-10 lg:px-12">
      <div className="w-full max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
          Smart Academic Scheduler
        </p>
        <h1 className="mt-4 font-serif text-5xl text-stone-50">
          Role-aware access for academic operations
        </h1>
        <p className="mt-4 text-base leading-8 text-stone-300">
          This layer makes the product feel more real: operations users can manage and publish
          schedules, while faculty and students are routed to the released timetable experience.
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
