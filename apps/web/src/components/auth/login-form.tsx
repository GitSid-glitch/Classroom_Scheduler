"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { roleLabel } from "@/lib/auth/access";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/session/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const payload = (await response.json()) as {
          username?: string;
          displayName?: string;
          role?: "ADMIN" | "COORDINATOR" | "FACULTY" | "STUDENT";
          error?: string;
        };

        if (!response.ok || !payload.role) {
          throw new Error(payload.error ?? "Login failed.");
        }

        const destination =
          payload.role === "ADMIN" || payload.role === "COORDINATOR"
            ? "/dashboard"
            : "/published-timetable";

        router.replace(destination);
        router.refresh();
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : "Login failed.");
      }
    });
  }

  return (
    <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/6 p-8 backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
        Access Control
      </p>
      <h2 className="mt-3 font-serif text-4xl text-stone-50">Sign in to your scheduling role</h2>
      <p className="mt-4 text-base leading-8 text-stone-300">
        Admins manage setup, approve, and publish releases. Coordinators run scheduling workflows and submit drafts for review. Faculty and students use the published timetable.
      </p>

      <div className="mt-6 rounded-xl border border-[#b9cec5] bg-[#f3f8f5] p-4 text-sm text-[#243a34]">
        <p className="font-semibold">Explore the sample workspace</p>
        <p className="mt-1 text-xs leading-5 text-[#4f625c]">
          It starts with sample campus data. You can edit it during your visit; demo changes reset when the service restarts.
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setForm({ username: "admin", password: "scheduler123" })}
          className="mt-3 rounded-lg border border-[#b9cec5] bg-white px-3.5 py-2 text-xs font-semibold text-[#17665b] hover:bg-[#eaf4f0] focus-visible:outline-[#17665b] disabled:opacity-60"
        >
          Fill demo sign-in
        </button>
      </div>

      <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm text-stone-200">
          Username
          <input
            className="rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-50"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            required
          />
        </label>
        <label className="grid gap-2 text-sm text-stone-200">
          Password
          <input
            className="rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-50"
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </label>

        {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="mt-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-8 rounded-[1.5rem] border border-stone-700 bg-stone-950/70 p-5">
        <p className="text-sm font-semibold text-stone-100">Role summary</p>
        <div className="mt-3 grid gap-2 text-sm text-stone-300">
          <p>{roleLabel("ADMIN")}: setup, scheduling, analytics, AI assistant, approval, publishing, restore</p>
          <p>{roleLabel("COORDINATOR")}: scheduling, conflicts, analytics, AI assistant, submit for approval</p>
          <p>{roleLabel("FACULTY")}: published timetable only</p>
          <p>{roleLabel("STUDENT")}: published timetable only</p>
        </div>
      </div>
    </section>
  );
}
