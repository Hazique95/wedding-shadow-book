import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "Shadow Book",
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fff7f6",
    theme_color: "#f6c66b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
