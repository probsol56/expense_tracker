import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

const siteUrl = config.siteUrl;

// Everything under (app)/* and /onboarding requires a signed-in session and is
// marked noindex — /login is the only page worth listing for crawlers.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
