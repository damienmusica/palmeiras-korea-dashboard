import type { Metadata } from "next";
import { getSquad } from "@/lib/adapters";
import { SquadView } from "@/components/squad/SquadView";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";

export const metadata: Metadata = {
  title: "스쿼드",
  description:
    "파우메이라스 1군 스쿼드를 포지션별로 정리하고, 각 선수의 역할·스타일을 한국어로 쉽게 설명합니다.",
};

export const revalidate = 300;

export default async function SquadPage() {
  const squad = await getSquad();
  return (
    <div className="space-y-4">
      <SectionHeading
        title="스쿼드"
        subtitle="포지션별 1군 명단 · 선수마다 한국어 해설"
        source={
          <FreshnessBadge
            origin={squad.origin}
            source={squad.source}
            fetchedAt={squad.fetchedAt}
            fellBack={squad.fellBack}
            note={squad.note}
          />
        }
      />
      <SquadView players={squad.data.players} coach={squad.data.coach} />
    </div>
  );
}
