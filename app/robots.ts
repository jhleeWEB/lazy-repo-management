import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "GPTBot",
          "ClaudeBot",
          "Claude-SearchBot",
          "PerplexityBot",
          "Googlebot",
          "Google-Extended",
          "Bingbot",
          "Yeti",
          "Daum",
        ],
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}sitemap.xml`,
  };
}

export const dynamic = "force-static";