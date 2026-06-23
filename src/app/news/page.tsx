import type { Metadata } from "next";
import { getNews } from "@/lib/adapters";
import { NewsView } from "@/components/news/NewsView";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "뉴스",
  description:
    "파우메이라스 관련 소식을 한국어 요약과 '왜 중요한가' 해설, 출처 신뢰도 라벨과 함께 제공합니다.",
};

export const revalidate = 300;

export default async function NewsPage() {
  const initial = await getNews();
  return (
    <div className="space-y-4">
      <SectionHeading
        title="뉴스"
        subtitle="단순 나열이 아니라, 한국 팬을 위한 해설과 함께"
      />
      <p className="text-sm text-[var(--pm-muted)]">
        각 카드에는 원문 출처·시간·언어, 한국어 요약, <b>왜 중요한가</b> 해설,
        <b> 팬 한 줄 요약</b>, 그리고 출처 신뢰도 라벨이 함께 표시됩니다. 전체
        기사 원문은 링크에서 확인하세요(저작권 보호를 위해 원문 전문은 복제하지
        않습니다).
      </p>
      <NewsView initial={initial} />
    </div>
  );
}
