import type { TeamConfig } from "@/lib/domain/types";

export function SiteFooter({ team }: { team: TeamConfig }) {
  return (
    <footer className="mt-12 border-t border-black/5 bg-[var(--pm-surface)]">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 pb-28 text-sm text-[var(--pm-muted)] sm:pb-8">
        <p>
          <strong className="text-[var(--pm-ink)]">
            파우메이라스 코리아 대시보드
          </strong>{" "}
          — 한국 팬을 위한 비공식 정보 대시보드입니다. {team.name}의 공식
          서비스가 아닙니다.
        </p>
        <p>
          순위·일정·뉴스처럼 변하는 정보는 무료 공개 소스(ESPN·구글 뉴스 등)에서{" "}
          <strong className="text-[var(--pm-ink)]">자동으로 갱신</strong>되고,
          역사·레전드·응원 문화 같은 고정 정보는 직접 다출처로 검증해 정리한{" "}
          <strong className="text-[var(--pm-ink)]">한국어 해설</strong>입니다.
          각 영역에 출처·신선도 배지가 붙으며, 외부 소스 연결이 일시적으로
          끊기면 <em>라벨이 붙은 오프라인 대체 데이터</em>로 표시됩니다.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {team.officialLinks.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--pm-primary-text)] hover:underline"
            >
              {l.labelKo} ↗
            </a>
          ))}
        </div>
        <p className="pt-2 text-xs">
          © {team.founded}–{new Date().getFullYear()} {team.name}. 상표·엠블럼은
          각 권리자에게 있습니다.
        </p>
      </div>
    </footer>
  );
}
