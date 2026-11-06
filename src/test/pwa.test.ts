import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA (Progressive Web App) Suite', () => {
  const rootDir = process.cwd();

  it('verifies public/site.webmanifest contains valid PWA configuration', () => {
    const manifestPath = path.join(rootDir, 'public', 'site.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifestContent.name).toBeDefined();
    expect(manifestContent.short_name).toBe('ตาลสั่ง');
    expect(manifestContent.start_url).toBe('/');
    expect(manifestContent.scope).toBe('/');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.orientation).toBe('portrait');
    expect(manifestContent.background_color).toBeDefined();
    expect(manifestContent.theme_color).toBeDefined();

    expect(Array.isArray(manifestContent.icons)).toBe(true);
    expect(manifestContent.icons.length).toBeGreaterThanOrEqual(2);

    const sizes = manifestContent.icons.map((icon: { sizes?: string }) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');

    const hasMaskable = manifestContent.icons.some(
      (icon: { purpose?: string }) => icon.purpose?.includes('maskable')
    );
    expect(hasMaskable).toBe(true);
  });

  it('verifies public/sw.js exists and configures offline precaching and API bypass', () => {
    const swPath = path.join(rootDir, 'public', 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Precache checks
    expect(swContent).toContain('/offline');
    expect(swContent).toContain('/site.webmanifest');
    expect(swContent).toContain('/favicon.ico');
    expect(swContent).toContain('/icon-192.png');
    expect(swContent).toContain('/icon-512.png');

    // Lifecycle events
    expect(swContent).toContain('addEventListener(\'install\'');
    expect(swContent).toContain('addEventListener(\'activate\'');
    expect(swContent).toContain('addEventListener(\'fetch\'');

    // Session safety check: must bypass /api/
    expect(swContent).toContain('/api/');
  });

  it('verifies offline page exists and exports a valid component', () => {
    const offlinePagePath = path.join(rootDir, 'src', 'app', 'offline', 'page.tsx');
    expect(fs.existsSync(offlinePagePath)).toBe(true);

    const content = fs.readFileSync(offlinePagePath, 'utf-8');
    expect(content).toContain('useI18n');
    expect(content).toContain('t.offline');
  });
});
