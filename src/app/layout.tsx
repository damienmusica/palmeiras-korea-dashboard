import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getActiveTeam } from "@/lib/teams";

const team = getActiveTeam();

const SITE_URL = "https://palmeiras-korea-dashboard.vercel.app";
const SITE_TITLE = "파우메이라스 코리아 대시보드 | Palmeiras Korea Dashboard";
const SITE_DESCRIPTION =
  "한국 팬을 위한 소시에다지 에스포르치바 파우메이라스(SE Palmeiras) 정보 대시보드 — 일정, 결과, 스쿼드, 순위, 뉴스, 팬 가이드를 한국 시간 기준으로 제공합니다.";
const SOCIAL_IMAGE = {
  url: "/teams/palmeiras/crest.png",
  width: 500,
  height: 500,
  alt: "Sociedade Esportiva Palmeiras 엠블럼",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | 파우메이라스 코리아",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Palmeiras Korea Dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "파우메이라스",
  },
  icons: {
    icon: "/teams/palmeiras/crest.png",
    apple: "/teams/palmeiras/crest.png",
  },
  keywords: [
    "Palmeiras",
    "파우메이라스",
    "Verdão",
    "Brasileirão",
    "축구",
    "브라질",
  ],
  // Social previews — the app is meant to be shared among Korean fans
  // (KakaoTalk / X), so a proper card matters.
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "파우메이라스 코리아 대시보드",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE.url],
  },
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
