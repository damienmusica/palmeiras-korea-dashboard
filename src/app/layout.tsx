import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getActiveTeam } from "@/lib/teams";

const team = getActiveTeam();

export const metadata: Metadata = {
  title: {
    default: "파우메이라스 코리아 대시보드 | Palmeiras Korea Dashboard",
    template: "%s | 파우메이라스 코리아",
  },
  description:
    "한국 팬을 위한 소시에다지 에스포르치바 파우메이라스(SE Palmeiras) 정보 대시보드 — 일정, 결과, 스쿼드, 순위, 뉴스, 팬 가이드를 한국 시간 기준으로 제공합니다.",
  applicationName: "Palmeiras Korea Dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "파우메이라스",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  keywords: [
    "Palmeiras",
    "파우메이라스",
    "Verdão",
    "Brasileirão",
    "축구",
    "브라질",
  ],
};

export const viewport: Viewport = {
  themeColor: "#006437",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          본문으로 건너뛰기
        </a>
        <SiteHeader team={team} />
        <main id="main" className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:pb-6">
          {children}
        </main>
        <SiteFooter team={team} />
        <MobileTabBar />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
