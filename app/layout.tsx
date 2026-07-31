import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoSweep — GitHub 저장소를 한 번에 정리",
  description:
    "GitHub 저장소를 선택해 아카이브하고, 필요할 때 안전하게 완전 삭제하세요.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "RepoSweep — 지울 레포, 한 번에 정리하세요.",
    description:
      "설정 페이지를 헤매지 않고 GitHub 저장소를 아카이브하고 비우는 가벼운 관리 도구.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoSweep — GitHub 저장소 정리 도구",
    description: "고르고, 아카이브하고, 필요할 때만 완전 삭제.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
