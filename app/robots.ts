import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

const siteUrl = config.siteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
