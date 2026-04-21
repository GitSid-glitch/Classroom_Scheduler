"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SchedulerApiClient } from "@/lib/api/scheduler-api-client";
import { authCookieKeys, roleLabel } from "@/lib/auth/access";

const apiClient = new SchedulerApiClient();

function persistCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 8}; samesite=lax`;
}

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
        const identity = await apiClient.authenticateUser(form);
        persistCookie(authCookieKeys.username, identity.username);
        persistCookie(authCookieKeys.displayName, identity.displayName);
        persistCookie(authCookieKeys.role, identity.role);

        const destination =
          identity.role === "ADMIN" || identity.role === "COORDINATOR"
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
      <h1 className="mt-3 font-serif text-4xl text-stone-50">Sign in to your scheduling role</h1>
      <p className="mt-4 text-base leading-8 text-stone-300">
        Admins manage setup and publishing, coordinators operate scheduling workflows, and
        faculty/students consume the published timetable.
      </p>

      <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm text-stone-200">
          Username
          <input
            className="rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-50"
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
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-8 rounded-[1.5rem] border border-stone-700 bg-stone-950/70 p-5">
        <p className="text-sm font-semibold text-stone-100">Role summary</p>
        <div className="mt-3 grid gap-2 text-sm text-stone-300">
          <p>{roleLabel("ADMIN")}: setup, scheduling, analytics, AI assistant, publishing</p>
          <p>{roleLabel("COORDINATOR")}: scheduling, conflicts, analytics, AI assistant, publishing</p>
          <p>{roleLabel("FACULTY")}: published timetable only</p>
          <p>{roleLabel("STUDENT")}: published timetable only</p>
        </div>
      </div>
    </section>
  );
}
