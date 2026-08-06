import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadSiteConfig() {
  vi.resetModules();
  return import('@/lib/site');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteConfig canonical URL', () => {
  it.each([
    'https://betondispo.ca',
    'https://www.betondispo.ca',
    'https://betondispo.com',
    'https://www.betondispo.com',
  ])('normalizes public host %s to the canonical .ca origin', async (url) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', url);
    const { siteConfig, absoluteUrl } = await loadSiteConfig();

    expect(siteConfig.url).toBe('https://betondispo.ca');
    expect(absoluteUrl('/fr')).toBe('https://betondispo.ca/fr');
  });

  it('ignores localhost in production', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3987');
    vi.stubEnv('VERCEL_ENV', 'production');
    const { siteConfig } = await loadSiteConfig();

    expect(siteConfig.url).toBe('https://betondispo.ca');
  });

  it('keeps localhost for local development', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3987');
    vi.stubEnv('VERCEL_ENV', 'development');
    const { siteConfig } = await loadSiteConfig();

    expect(siteConfig.url).toBe('http://localhost:3987');
  });

  it('generates only canonical .ca sitemap URLs from a secondary .com origin', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://betondispo.com');
    vi.resetModules();
    const { default: sitemap } = await import('@/app/sitemap');

    const xmlValues = JSON.stringify(await sitemap());
    expect(xmlValues).toContain('https://betondispo.ca/fr');
    expect(xmlValues).toContain('https://betondispo.ca/fr/beton-garage');
    expect(xmlValues).toContain('https://betondispo.ca/en/garage-concrete-slab');
    expect(xmlValues).toContain('https://betondispo.ca/fr/prix-beton-m3');
    expect(xmlValues).toContain('https://betondispo.ca/en/concrete-pumping');
    expect(xmlValues).not.toContain('betondispo.com');
    expect(xmlValues).not.toContain('vercel.app');
    expect(xmlValues).not.toContain('localhost:3987');
  });

  it('points production robots.txt at the canonical .ca sitemap', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3987');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.resetModules();
    const { default: robots } = await import('@/app/robots');

    expect(robots()).toMatchObject({
      sitemap: 'https://betondispo.ca/sitemap.xml',
      host: 'https://betondispo.ca',
    });
  });
});
