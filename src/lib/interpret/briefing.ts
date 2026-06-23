// =============================================================================
// The "오늘의 5분 파우메이라스 브리핑" composer — the flagship of the
// interpretation-first pivot. Turns the derived dashboard model + insights into
// a short, human Korean briefing a newcomer can read in five minutes.
// Editorial/seed framing; precise facts come from the underlying data.
// =============================================================================

import type {
  Briefing,
  BriefingItem,
  NewsItem,
  Player,
  TeamConfig,
} from "@/lib/domain/types";
import type { DashboardModel } from "@/lib/services/dashboard";
import { matchInsight } from "@/lib/interpret/matches";
import { playerInsight } from "@/lib/interpret/players";
import { competitionContext } from "@/lib/interpret/competitions";
import { toKST } from "@/lib/format/datetime";

/** Pick the most compelling "player to watch", biased to the next opponent. */
function pickPlayerToWatch(players: Player[]): Player | null {
  const preferred = ["estevao", "flaco-lopez", "raphael-veiga", "vitor-roque"];
  for (const id of preferred) {
    const p = players.find((x) => x.id === id);
    if (p) return p;
  }
  return players[0] ?? null;
}

export function buildBriefing(
  team: TeamConfig,
  model: DashboardModel,
  players: Player[],
  news: NewsItem[],
  now: Date = new Date(),
): Briefing {
  const items: BriefingItem[] = [];

  // 1) What changed recently
  const changed = model.changeLog.slice(0, 3);
  items.push({
    icon: "📌",
    label: "최근 변화",
    headlineKo:
      changed.length > 0 ? "이런 일이 있었어요" : "최근 큰 변화는 없어요",
    bodyKo:
      changed.length > 0
        ? changed.map((c) => `· ${c.text}`).join("\n")
        : "최근 24시간 내 주요 변동 사항이 없습니다. 다음 일정을 확인해 보세요.",
    href: "/news",
  });

  // 2) Next match and why it matters
  if (model.nextMatch) {
    const m = model.nextMatch;
    const insight = matchInsight(m, team);
    const opp = m.home.id === team.id ? m.away : m.home;
    const kst = toKST(m.kickoff);
    items.push({
      icon: "🗓️",
      label: "다음 경기",
      headlineKo: `vs ${opp.nameKo} · ${kst.date} ${kst.time} (KST)`,
      bodyKo: insight.whyItMattersKo,
      href: "/fixtures",
    });
  }

  // 3) Last result + emotional reading
  if (model.lastResult) {
    const m = model.lastResult;
    const insight = matchInsight(m, team);
    const opp = m.home.id === team.id ? m.away : m.home;
    items.push({
      icon: "🔁",
      label: "지난 결과",
      headlineKo: m.score
        ? `vs ${opp.nameKo} ${m.score.home}-${m.score.away}`
        : `vs ${opp.nameKo}`,
      bodyKo:
        insight.resultReadingKo ??
        "지난 경기 결과에 대한 해석을 준비 중입니다.",
      href: "/fixtures",
    });
  }

  // 4) One player to watch
  const watch = pickPlayerToWatch(players);
  if (watch) {
    const pi = playerInsight(watch);
    items.push({
      icon: "⭐",
      label: "주목할 선수",
      headlineKo: `${watch.nameKo} (${watch.positionKo})`,
      bodyKo: `${pi.roleKo}. ${pi.whyCareKo}`,
      href: `/squad/${watch.id}`,
    });
  }

  // 5) One current storyline (from latest meaningful news)
  const storyline = news[0];
  if (storyline) {
    items.push({
      icon: "🧵",
      label: "지금의 스토리라인",
      headlineKo: storyline.summaryKo.split(".")[0].slice(0, 40),
      bodyKo: storyline.whyItMattersKo ?? storyline.summaryKo,
      href: "/news",
    });
  }

  // 6) One beginner-friendly explanation (tied to next match's competition)
  const compId = model.nextMatch?.competition.id ?? "brasileirao";
  const ctx = competitionContext(compId);
  items.push({
    icon: "📖",
    label: "오늘의 한 줄 상식",
    headlineKo: `${ctx.nameKo}란?`,
    bodyKo: ctx.taglineKo + " — " + ctx.explainerKo,
    href: "/guide",
  });

  return { asOf: now.toISOString(), items, source: "editorial" };
}
