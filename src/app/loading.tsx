import { SkeletonCard } from "@/components/ui/Skeleton";

/** Route-level loading fallback shown during navigation/data fetches. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">불러오는 중…</span>
      <div className="shimmer h-28 rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
