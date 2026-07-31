import type { Metadata } from "next";
import Home from "@/app/page";
import type { Locale } from "@/lib/i18n";
import {
  languageAlternates,
  localeUrl,
  publicLocales,
  seoCopy,
  SITE_URL,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return publicLocales.map((locale) => ({ locale }));
}

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const copy = seoCopy[locale];
  const url = localeUrl(locale);

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: {
      canonical: url,
      languages: languageAlternates,
    },
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      url,
      siteName: "RepoSweep",
      locale: copy.openGraphLocale,
      images: [{
        url: `${SITE_URL}og.png`,
        width: 1536,
        height: 1024,
        alt: "RepoSweep GitHub repository manager",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [`${SITE_URL}og.png`],
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  return <Home initialLocale={locale as Locale} />;
}