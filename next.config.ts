import type { NextConfig } from "next";

const basePath = process.env.PAGES_BASE_PATH ?? "";
const isPagesBuild = Boolean(basePath);

const nextConfig: NextConfig = {
  output: isPagesBuild ? "export" : undefined,
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID:
      process.env.NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID ??
      process.env.GITHUB_OAUTH_CLIENT_ID,
    NEXT_PUBLIC_OAUTH_BRIDGE_URL:
      process.env.NEXT_PUBLIC_OAUTH_BRIDGE_URL,
  },
};

export default nextConfig;
