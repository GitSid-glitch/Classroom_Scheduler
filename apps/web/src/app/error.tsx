"use client";

interface AppErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function AppError({ unstable_retry }: AppErrorProps) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-5 py-12 sm:px-8" role="alert">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#17665b]">Workspace error</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#142622]">This page could not be loaded</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
        The page could not finish loading. Changes made just before this error may not have been saved. Retry, or return to the scheduling overview.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={unstable_retry} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-semibold">
          Try again
        </button>
        <a href="/dashboard" className="rounded-lg border border-[#dce6e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#243a34] hover:bg-[#f4faf7]">
          Return to overview
        </a>
      </div>
    </main>
  );
}
