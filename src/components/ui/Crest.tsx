/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

/**
 * Crest/avatar image that never renders broken: on error it swaps to an inline
 * monogram fallback. Uses a plain <img> (not next/image) so local SVGs and
 * arbitrary optional remote hosts both work without image-domain config.
 */
export function Crest({
  src,
  alt,
  label,
  size = 40,
  className = "",
}: {
  src?: string;
  alt: string;
  /** Text used for the monogram fallback (first letters). */
  label: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const monogram = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  if (!src || failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--pm-primary)] font-bold text-white ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        role="img"
        aria-label={alt}
      >
        {monogram || "?"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
