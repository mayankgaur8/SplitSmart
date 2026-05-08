"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#060914] text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 text-3xl">
        ⚡
      </div>
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="max-w-xs text-center text-slate-400">
        SplitSmart needs an internet connection to sync your expenses. Check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-6 py-2.5 text-sm font-semibold"
      >
        Retry
      </button>
    </div>
  );
}
