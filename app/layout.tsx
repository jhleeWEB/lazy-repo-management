import type { Metadata } from "next";
import { languageAlternates, seoCopy, SITE_URL } from "@/lib/seo";
import "./globals.css";

const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  "-wz1RWutyHz5hjvfp9ntFex4F2EhNLO0cCZ1xKHVvMA";
const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION;
const bingVerification =
  process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ||
  "0260EED594544522F26A1D88E0BCE677";

const verificationOther = {
  ...(naverVerification ? { "naver-site-verification": naverVerification } : {}),
  ...(bingVerification ? { "msvalidate.01": bingVerification } : {}),
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "RepoSweep",
  title: seoCopy.ko.title,
  description: seoCopy.ko.description,
  keywords: seoCopy.ko.keywords,
  authors: [{ name: "jhleeWEB", url: "https://github.com/jhleeWEB" }],
  creator: "jhleeWEB",
  publisher: "RepoSweep",
  category: "DeveloperApplication",
  alternates: {
    canonical: SITE_URL,
    languages: languageAlternates,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(Object.keys(verificationOther).length ? { other: verificationOther } : {}),
  },
  icons: {
    icon: `${SITE_URL}favicon.svg`,
    shortcut: `${SITE_URL}favicon.svg`,
    apple: `${SITE_URL}favicon.svg`,
  },
  manifest: `${SITE_URL}manifest.webmanifest`,
  openGraph: {
    type: "website",
    title: seoCopy.ko.title,
    description: seoCopy.ko.description,
    url: SITE_URL,
    siteName: "RepoSweep",
    locale: seoCopy.ko.openGraphLocale,
    alternateLocale: Object.values(seoCopy).filter((copy) => copy !== seoCopy.ko).map((copy) => copy.openGraphLocale),
    images: [{ url: `${SITE_URL}og.png`, width: 1536, height: 1024, alt: "RepoSweep GitHub repository manager" }],
  },
  twitter: {
    card: "summary_large_image",
    title: seoCopy.ko.title,
    description: seoCopy.ko.description,
    images: [`${SITE_URL}og.png`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name: "RepoSweep",
        alternateName: "Lazy Repo Management",
        description: seoCopy.ko.description,
        inLanguage: ["ko", "en", "es", "ja", "pt-BR", "zh-CN", "ru", "fr", "de"],
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}#app`,
        url: SITE_URL,
        name: "RepoSweep",
        description: seoCopy.en.description,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a GitHub account",
        isAccessibleForFree: true,
        image: `${SITE_URL}og.png`,
        featureList: [
          "Bulk GitHub repository archiving",
          "Bulk GitHub repository restoration",
          "Permanent repository deletion with confirmation",
          "Repository search, filters, and multi-select",
          "GitHub OAuth authentication",
        ],
        offers: {
          "@type": "Offer",
          price: 0,
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "jhleeWEB",
          url: "https://github.com/jhleeWEB",
        },
      },
    ],
  };

  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="16cf2a0a-48f2-4aef-974d-7d95448a3169"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}