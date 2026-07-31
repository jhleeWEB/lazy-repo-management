import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RepoSweep — GitHub Repository Manager",
    short_name: "RepoSweep",
    description: "Bulk archive, restore, and permanently delete GitHub repositories.",
    start_url: SITE_URL,
    display: "standalone",
    background_color: "#f2f1eb",
    theme_color: "#171713",
    icons: [
      {
        src: `${SITE_URL}favicon.svg`,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

export const dynamic = "force-static";
