import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://jhleeweb.github.io/lazy-repo-management/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RepoSweep — 쌓아둔 GitHub 레포, 한 번에 치워",
  description: "GitHub 레포를 고르고 아카이브하고, 진짜 필요 없으면 영구 삭제하는 가벼운 청소 도구.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "RepoSweep — 뭐부터 치울까?",
    description: "설정 페이지 순례는 끝. 고르고 치우고, 필요 없으면 진짜 보내.",
    url: siteUrl,
    siteName: "RepoSweep",
    images: [{ url: `${siteUrl}og.png`, width: 1536, height: 1024, alt: "RepoSweep — 뭐부터 치울까?" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoSweep — 뭐부터 치울까?",
    description: "고르고 치우고, 필요 없으면 진짜 보내.",
    images: [`${siteUrl}og.png`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}