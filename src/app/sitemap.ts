import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils/url";
import { getCurrentWeekRecord } from "@/lib/services/fuel-service";

const BASE_URL = getBaseUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const current = getCurrentWeekRecord();
  const lastModified = new Date(current.announcementDate);

  return [
    {
      url: `${BASE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/api/prices`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/feed.xml`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/feed.json`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/llms.txt`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];
}
