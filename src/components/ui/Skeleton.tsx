/** Loading skeleton block. Decorative — hidden from assistive tech. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`shimmer rounded-md ${className}`} aria-hidden="true" />
  );
}

/** A card-shaped skeleton group for list loading states. */
export function SkeletonCard() {
  return (
    <div className="pm-card space-y-3 p-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
