"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crest } from "@/components/ui/Crest";
import type { TeamConfig } from "@/lib/domain/types";

const NAV = [
  { href: "/", label: "홈", en: "Home" },
  { href: "/news", label: "뉴스", en: "News" },
  { href: "/squad", label: "스쿼드", en: "Squad" },
  { href: "/fixtures", label: "일정·결과", en: "Fixtures" },
  { href: "/standings", label: "순위·기록", en: "Table" },
  { href: "/guide", label: "팬 가이드", en: "Guide" },
];

export function SiteHeader({ team }: { team: TeamConfig }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[var(--pm-surface)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--pm-surface)]/70">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label={`${team.nameKo} 홈`}
        >
          <Crest
            src={team.crest}
            alt={`${team.name} 엠블럼`}
            label={team.shortName}
            size={36}
          />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold tracking-tight">
              파우메이라스 코리아
            </span>
            <span className="text-[11px] text-[var(--pm-muted)]">
              Palmeiras Korea Dashboard
            </span>
          </span>
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="ml-auto flex items-center gap-0.5 overflow-x-auto"
        >
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--pm-primary)] text-white"
                    : "text-[var(--pm-ink)] hover:bg-black/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
