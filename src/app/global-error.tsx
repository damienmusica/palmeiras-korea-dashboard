"use client";

import { useEffect } from "react";

/**
 * Layout-level error boundary. `error.tsx` only catches errors thrown *inside*
 * the root layout's children; if the root layout itself (or something it
 * depends on) throws, Next renders THIS instead — so it must supply its own
 * <html>/<body>. Keeps a friendly Korean fallback rather than a white screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          textAlign: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', sans-serif",
          color: "#0a0a0a",
          background: "#ffffff",
          padding: "24px",
        }}
      >
        <span style={{ fontSize: "48px" }} aria-hidden="true">
          ⚠️
        </span>
        <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
          문제가 발생했습니다
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          일시적인 오류일 수 있어요. 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "8px",
            borderRadius: "8px",
            border: "none",
            background: "#006437",
            color: "#ffffff",
            fontWeight: 600,
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
