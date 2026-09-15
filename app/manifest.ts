import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wallo — Personal Finance, Elevated",
    short_name: "Wallo",
    description: "A calmer, premium way to track and understand your money.",
    start_url: "/",
    display: "standalone",
    background_color: "#EEF1EF",
    theme_color: "#16211B",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
