"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/news", label: "뉴스", icon: "📰" },
  { href: "/squad", label: "스쿼드", icon: "👥" },
  { href: "/fixtures", label: "일정", icon: "🗓️" },
  { href: "/standings", label: "순위", icon: "📊" },
  { href: "/guide", label: "가이드", icon: "📖" },
];

/**
 * App-like bottom tab bar for mobile. Hidden on >= sm (desktop uses the header
 * nav). Fixed to the bottom with safe-area padding for notched iPhones.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="모바일 메뉴"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[var(--pm-surface)]/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-5xl">
        {TABS.map((t) => {
          const active = isActive(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                  active ? "text-[var(--pm-primary)]" : "text-[var(--pm-muted)]"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {t.icon}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
