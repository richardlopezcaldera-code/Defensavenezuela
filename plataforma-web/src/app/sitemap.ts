import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

  return [
    { url: SITIO.url, lastModified: ahora, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITIO.url}/agentes`,
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
