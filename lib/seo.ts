import type { Locale } from "@/lib/i18n";

export const SITE_URL = "https://jhleeweb.github.io/lazy-repo-management/";
export const INDEXNOW_KEY = "9f5d48a124fc4c0baa9fec27dcb7d303";

export const publicLocales = ["en", "es", "ja", "pt", "zh", "ru", "fr", "de"] as const;

type SeoCopy = {
  title: string;
  description: string;
  keywords: string[];
  openGraphLocale: string;
};

export const seoCopy: Record<Locale, SeoCopy> = {
  ko: {
    title: "RepoSweep — GitHub 레포 일괄 아카이브·삭제",
    description:
      "GitHub 저장소를 한 화면에서 골라 일괄 아카이브, 복원, 영구 삭제하는 무료 레포 관리 도구. 설정 페이지를 하나씩 돌지 말고 RepoSweep으로 치워.",
    keywords: ["GitHub 레포 삭제", "GitHub 저장소 일괄 삭제", "GitHub 레포 아카이브", "GitHub 저장소 관리", "RepoSweep"],
    openGraphLocale: "ko_KR",
  },
  en: {
    title: "RepoSweep — Bulk Archive & Delete GitHub Repositories",
    description:
      "A free, lightweight GitHub repository manager to bulk archive, restore, and permanently delete repositories without visiting every Settings page.",
    keywords: ["bulk delete GitHub repositories", "archive GitHub repositories", "GitHub repository manager", "RepoSweep"],
    openGraphLocale: "en_US",
  },
  es: {
    title: "RepoSweep — Archiva y elimina repositorios de GitHub",
    description:
      "Gestor gratuito y ligero para archivar, restaurar y eliminar permanentemente varios repositorios de GitHub desde una sola pantalla.",
    keywords: ["eliminar repositorios GitHub", "archivar repositorios GitHub", "gestor de repositorios GitHub", "RepoSweep"],
    openGraphLocale: "es_ES",
  },
  ja: {
    title: "RepoSweep — GitHubリポジトリを一括アーカイブ・削除",
    description:
      "GitHubリポジトリを一画面で選び、一括アーカイブ、復元、完全削除できる無料で軽量な管理ツール。設定ページ巡りはもう不要。",
    keywords: ["GitHub リポジトリ 一括削除", "GitHub リポジトリ アーカイブ", "GitHub リポジトリ 管理", "RepoSweep"],
    openGraphLocale: "ja_JP",
  },
  pt: {
    title: "RepoSweep — Arquive e exclua repositórios GitHub em lote",
    description:
      "Gerenciador gratuito e leve para arquivar, restaurar e excluir permanentemente vários repositórios GitHub em uma única tela.",
    keywords: ["excluir repositórios GitHub em lote", "arquivar repositórios GitHub", "gerenciador GitHub", "RepoSweep"],
    openGraphLocale: "pt_BR",
  },
  zh: {
    title: "RepoSweep — 批量归档和删除 GitHub 仓库",
    description:
      "免费轻量的 GitHub 仓库管理工具，可在一个页面批量归档、恢复和永久删除仓库，不用逐个进入设置页面。",
    keywords: ["批量删除 GitHub 仓库", "归档 GitHub 仓库", "GitHub 仓库管理", "RepoSweep"],
    openGraphLocale: "zh_CN",
  },
  ru: {
    title: "RepoSweep — Массовый архив и удаление репозиториев GitHub",
    description:
      "Бесплатный лёгкий инструмент для массового архивирования, восстановления и окончательного удаления репозиториев GitHub на одном экране.",
    keywords: ["массовое удаление репозиториев GitHub", "архив GitHub", "управление репозиториями GitHub", "RepoSweep"],
    openGraphLocale: "ru_RU",
  },
  fr: {
    title: "RepoSweep — Archiver et supprimer des dépôts GitHub en lot",
    description:
      "Un gestionnaire gratuit et léger pour archiver, restaurer et supprimer définitivement plusieurs dépôts GitHub depuis un seul écran.",
    keywords: ["supprimer des dépôts GitHub en lot", "archiver des dépôts GitHub", "gestionnaire de dépôts GitHub", "RepoSweep"],
    openGraphLocale: "fr_FR",
  },
  de: {
    title: "RepoSweep — GitHub-Repositories gesammelt archivieren & löschen",
    description:
      "Kostenloses, leichtes Tool zum gemeinsamen Archivieren, Wiederherstellen und endgültigen Löschen mehrerer GitHub-Repositories.",
    keywords: ["GitHub Repositories gesammelt löschen", "GitHub Repository archivieren", "GitHub Repository Manager", "RepoSweep"],
    openGraphLocale: "de_DE",
  },
};

export function localeUrl(locale: Locale) {
  return locale === "ko" ? SITE_URL : `${SITE_URL}${locale}/`;
}

export const languageAlternates: Record<string, string> = {
  ko: localeUrl("ko"),
  en: localeUrl("en"),
  es: localeUrl("es"),
  ja: localeUrl("ja"),
  "pt-BR": localeUrl("pt"),
  "zh-CN": localeUrl("zh"),
  ru: localeUrl("ru"),
  fr: localeUrl("fr"),
  de: localeUrl("de"),
  "x-default": SITE_URL,
};