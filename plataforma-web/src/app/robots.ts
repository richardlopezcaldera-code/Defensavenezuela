import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] }],
    sitemap: `${SITIO.url}/sitemap.xml`,
  };
}
