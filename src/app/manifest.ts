import type { MetadataRoute } from "next";

// PWA manifest — makes the app installable to the iPhone/Android home screen
// (standalone, no browser chrome). Served at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "파우메이라스 코리아 대시보드",
    short_name: "파우메이라스",
    description:
      "한국 팬을 위한 소시에다지 에스포르치바 파우메이라스(SE Palmeiras) 정보 대시보드 — 일정·결과·스쿼드·순위·뉴스를 한국어로.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c130f",
    theme_color: "#006437",
    lang: "ko",
    categories: ["sports"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
