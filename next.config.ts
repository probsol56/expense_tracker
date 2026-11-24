import type { NextConfig } from "next";
import { config } from "./lib/config";
import { buildSecurityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  output: process.platform === "win32" ? undefined : "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          supabaseUrl: config.supabaseUrl,
          sentryDsn: config.sentryDsn,
          folioReportsUrl: config.folioReportsUrl,
          isProduction: config.isProduction,
        }),
      },
    ];
  },
};

export default nextConfig;
