import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Sans_Thai, IBM_Plex_Mono } from 'next/font/google';
import { siteConfig, constructMetadata } from '@/config/site';
import './globals.css';
import { AppProviders } from './providers';
import { BottomNavbar } from '@/components/shared/bottom-navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans-en',
  display: 'swap',
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = constructMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: siteConfig.themeColor,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      data-theme="street-food"
      className={`${inter.variable} ${ibmPlexSansThai.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased selection:bg-neutral-200 selection:text-black">
        <AppProviders>
          {children}
          <BottomNavbar />
        </AppProviders>
      </body>
    </html>
  );
}
