export function isLocalhost(urlStr: string): boolean {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/i.test(urlStr.trim());
}

export function normalizeUrl(urlStr: string): string {
  const trimmed = urlStr.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  if (!isLocalhost(trimmed) && trimmed.startsWith("http://")) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  return trimmed;
}

export const PRIMARY_DOMAIN = "www.subiolagasolina.com";
export const APEX_DOMAIN = "subiolagasolina.com";
export const VERCEL_DOMAIN = "subiolagasolina.vercel.app";

export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);
  const isProd = process.env.NODE_ENV === "production" || isVercel;

  const customAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (customAppUrl) {
    const isLocal = isLocalhost(customAppUrl);
    if (!isLocal || !isProd) {
      return normalizeUrl(customAppUrl);
    }
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const prodUrl = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    // Only use VERCEL_PROJECT_PRODUCTION_URL if it's already a custom domain (not default vercel.app)
    if (!prodUrl.includes("vercel.app") && prodUrl !== "https://undefined") {
      return prodUrl;
    }
  }

  if (isProd) {
    return `https://${PRIMARY_DOMAIN}`;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl !== "undefined") {
    return normalizeUrl(vercelUrl);
  }

  return "http://localhost:3000";
}

export function getAbsoluteUrl(path: string): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
