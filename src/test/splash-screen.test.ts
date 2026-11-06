import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { th } from '@/messages/th';
import { en } from '@/messages/en';
import tailwindConfig from '../../tailwind.config';

describe('App Startup Splash & Mascot Logo Animation Suite', () => {
  const rootDir = process.cwd();

  it('verifies brand mascot and logo asset exist in public directory', () => {
    const mascotPath = path.join(rootDir, 'public', 'brand-mascot.png');
    const logoPath = path.join(rootDir, 'public', 'logo.png');

    expect(fs.existsSync(mascotPath)).toBe(true);
    expect(fs.existsSync(logoPath)).toBe(true);
    expect(fs.statSync(mascotPath).size).toBeGreaterThan(1000);
  });

  it('verifies SplashScreen component is implemented and exported', () => {
    const componentPath = path.join(rootDir, 'src', 'components', 'shared', 'splash-screen.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);

    const fileContent = fs.readFileSync(componentPath, 'utf-8');
    expect(fileContent).toContain('export function SplashScreen');
    expect(fileContent).toContain('tan_sang_replay_splash');
    expect(fileContent).toContain('tan_sang_splash_seen');
    expect(fileContent).toContain('/brand-mascot.png');
  });

  it('verifies providers integrates SplashScreen for seamless initial launch', () => {
    const providersPath = path.join(rootDir, 'src', 'app', 'providers.tsx');
    const providersContent = fs.readFileSync(providersPath, 'utf-8');

    expect(providersContent).toContain('SplashScreen');
    expect(providersContent).toContain('<SplashScreen />');
  });

  it('verifies tailwind config includes cute mascot animations and keyframes', () => {
    const keyframes = tailwindConfig.theme?.extend?.keyframes as Record<string, unknown>;
    const animations = tailwindConfig.theme?.extend?.animation as Record<string, unknown>;

    expect(keyframes['mascot-bounce']).toBeDefined();
    expect(keyframes['mascot-wiggle']).toBeDefined();
    expect(keyframes['mascot-shadow']).toBeDefined();
    expect(keyframes['particle-float-1']).toBeDefined();
    expect(keyframes['particle-float-2']).toBeDefined();
    expect(keyframes['splash-progress']).toBeDefined();

    expect(animations['mascot-bounce']).toBeDefined();
    expect(animations['mascot-wiggle']).toBeDefined();
    expect(animations['splash-progress']).toBeDefined();
  });

  it('verifies i18n translation keys exist for splash screen in TH and EN', () => {
    expect(th.splash).toBeDefined();
    expect(en.splash).toBeDefined();
    expect(th.splash.welcome).toBeTruthy();
    expect(en.splash.welcome).toBeTruthy();
    expect(th.splash.slogan).toBeTruthy();
    expect(en.splash.slogan).toBeTruthy();
    expect(th.splash.preparing).toBeTruthy();
    expect(en.splash.preparing).toBeTruthy();
    expect(th.splash.tapToSkip).toBeTruthy();
    expect(en.splash.tapToSkip).toBeTruthy();
  });
});
