import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <span className="text-5xl" aria-hidden="true">
        🌴
      </span>
      <h1 className="text-2xl font-extrabold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-[var(--pm-muted)]">
        요청하신 내용이 존재하지 않거나 이동되었어요.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--pm-primary)] px-4 py-2 font-semibold text-white"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
