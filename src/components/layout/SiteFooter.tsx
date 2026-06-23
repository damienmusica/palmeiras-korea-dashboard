import type { TeamConfig } from "@/lib/domain/types";

export function SiteFooter({ team }: { team: TeamConfig }) {
  return (
    <footer className="mt-12 border-t border-black/5 bg-[var(--pm-surface)]">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-sm text-[var(--pm-muted)]">
        <p>
          <strong className="text-[var(--pm-ink)]">
            파우메이라스 코리아 대시보드
          </strong>{" "}
          — 한국 팬을 위한 비공식 정보 대시보드입니다. {team.name}의 공식
          서비스가 아닙니다.
        </p>
        <p>
          데이터는 환경 변수로 라이브 소스를 연결하지 않으면 현실적인{" "}
          <em>시드(mock) 데이터</em>로 표시되며, 각 영역에 출처·신선도 배지가
          붙습니다.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {team.officialLinks.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--pm-primary)] hover:underline"
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
