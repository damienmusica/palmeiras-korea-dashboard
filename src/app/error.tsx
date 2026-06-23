"use client";

import { useEffect } from "react";

/**
 * App-level error boundary. Keeps a friendly Korean fallback instead of a white
 * screen if a server/render error escapes a section. Logs to the console for
 * diagnostics; no sensitive detail is shown to the user.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <span className="text-5xl" aria-hidden="true">
        ⚠️
      </span>
      <h1 className="text-2xl font-extrabold">문제가 발생했습니다</h1>
      <p className="text-sm text-[var(--pm-muted)]">
        일시적인 오류일 수 있어요. 다시 시도해 주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[var(--pm-primary)] px-4 py-2 font-semibold text-white"
      >
        다시 시도
      </button>
    </div>
  );
}
