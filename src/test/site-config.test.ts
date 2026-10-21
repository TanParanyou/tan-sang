import { describe, it, expect } from 'vitest';
import { siteConfig, constructMetadata } from '@/config/site';

describe('siteConfig & constructMetadata', () => {
  it('has valid site configuration defaults', () => {
    expect(siteConfig.name).toBe('Tan-Sang (ทันสั่ง)');
    expect(siteConfig.title).toBeDefined();
    expect(siteConfig.description).toBeDefined();
    expect(siteConfig.url).toBeDefined();
    expect(siteConfig.ogImage).toBe('/og.png');
    expect(siteConfig.keywords.length).toBeGreaterThan(0);
    expect(siteConfig.themeColor).toBe('#FAFAFA');
    expect(siteConfig.locale).toBe('th_TH');
  });

  it('constructs default metadata properly', () => {
    const meta = constructMetadata();

    expect(meta.description).toBe(siteConfig.description);
    expect(meta.openGraph?.title).toBe(siteConfig.title);
    expect(meta.openGraph?.siteName).toBe(siteConfig.name);
    expect(meta.openGraph?.locale).toBe(siteConfig.locale);
    expect((meta.twitter as { card?: string })?.card).toBe('summary_large_image');
    expect(meta.robots).toMatchObject({
      index: true,
      follow: true,
    });
    expect(meta.manifest).toBe('/site.webmanifest');
  });

  it('customizes metadata with page-specific overrides', () => {
    const meta = constructMetadata({
      title: 'หน้าจัดการร้านค้า',
      description: 'คำอธิบายสำหรับหน้าแอดมิน',
      noIndex: true,
      canonicalUrl: 'https://example.com/admin/stores',
    });

    expect(meta.title).toBe('หน้าจัดการร้านค้า');
    expect(meta.description).toBe('คำอธิบายสำหรับหน้าแอดมิน');
    expect(meta.robots).toMatchObject({
      index: false,
      follow: false,
    });
    expect(meta.alternates?.canonical).toBe('https://example.com/admin/stores');
  });
});
