import type { MetadataRoute } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/site';

function isIndexableProductionHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ['betondispo.com', 'www.betondispo.com', 'betondispo.ca', 'www.betondispo.ca'].includes(
        parsed.hostname,
      )
    );
  } catch {
    return false;
  }
}

export default function robots(): MetadataRoute.Robots {
  // Preview deployments and local runs must never be indexed.
  const isProduction =
    isIndexableProductionHost(siteConfig.url) &&
    (siteConfig.hasExplicitSiteUrl || process.env.VERCEL_ENV === 'production');

  if (!isProduction) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteConfig.url,
  };
}
