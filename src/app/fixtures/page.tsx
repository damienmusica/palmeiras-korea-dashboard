import type { Metadata } from "next";
import { getMatches } from "@/lib/adapters";
import { FixturesView } from "@/components/fixtures/FixturesView";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";
import { CompetitionPrimer } from "@/components/fixtures/CompetitionPrimer";

export const metadata: Metadata = {
  title: "일정·결과",
  description:
    "파우메이라스의 예정 경기와 결과를 한국·브라질 시간으로 보여주고, 각 경기의 '왜 중요한가'와 관전 포인트를 설명합니다.",
};

export const revalidate = 300;

export default async function FixturesPage() {
  const matchesRes = await getMatches();
  return (
    <div className="space-y-4">
      <SectionHeading
        title="일정 · 결과 (매치 센터)"
        subtitle="한국 시간(KST)과 브라질 시간(BRT)을 함께, 맥락과 함께"
        source={
          <FreshnessBadge
            origin={matchesRes.origin}
            source={matchesRes.source}
            fetchedAt={matchesRes.fetchedAt}
            fellBack={matchesRes.fellBack}
            note={matchesRes.note}
          />
        }
      />
      <CompetitionPrimer />
      <FixturesView matches={matchesRes.data} />
    </div>
  );
}
