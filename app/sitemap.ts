import type { MetadataRoute } from "next";
import type { Locale } from "@/lib/i18n";
import {
  languageAlternates,
  localeUrl,
  publicLocales,
} from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-31T00:00:00.000Z");
  const locales: Locale[] = ["ko", ...publicLocales];

  return locales.map((locale) => ({
    url: localeUrl(locale),
    lastModified,
    changeFrequency: "monthly",
    priority: locale === "ko" ? 1 : 0.9,
    alternates: {
      languages: languageAlternates,
    },
  }));
}

export const dynamic = "force-static";