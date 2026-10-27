import type { Metadata } from 'next';

const getAppUrl = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

export const siteConfig = {
  name: 'ตาลสั่ง (Tan-Sang)',
  shortName: 'ตาลสั่ง',
  title: 'ตาลสั่ง (Tan-Sang) — ระบบเปิดบิลสั่งอาหารกลุ่มผ่าน LINE',
  description:
    'สั่งอาหารกลุ่มในแชท LINE เลือกเมนู ท็อปปิ้ง แยกบิลรายคน และคัดลอกข้อความสรุปส่งร้านค้าได้ในคลิกเดียว',
  url: getAppUrl(),
  ogImage: '/og.png',
  keywords: [
    'ตาลสั่ง',
    'ทันสั่ง',
    'Tan-Sang',
    'สั่งอาหารกลุ่ม',
    'เปิดบิลสั่งข้าว',
    'หารค่าข้าว',
    'แยกบิล',
    'LINE LIFF',
    'LINE Bot',
    'รวมบิล',
    'สรุปออเดอร์',
    'สั่งข้าวออฟฟิศ',
    'Food Ordering',
  ],
  authors: [
    {
      name: 'Tan-Sang Team',
      url: 'https://github.com',
    },
  ],
  creator: 'Tan-Sang',
  themeColor: '#FAFAFA',
  locale: 'th_TH',
  links: {
    github: 'https://github.com',
    line: 'https://line.me',
  },
} as const;

export type SiteConfig = typeof siteConfig;

export interface ConstructMetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  icons?: Metadata['icons'];
  noIndex?: boolean;
  canonicalUrl?: string;
  keywords?: string[];
  authors?: Array<{ name: string; url?: string }>;
}

/**
 * Helper function to construct standard Next.js Metadata
 * with Open Graph, Twitter Cards, SEO robots, and icons.
 */
export function constructMetadata({
  title = siteConfig.title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  noIndex = false,
  canonicalUrl,
  keywords = [...siteConfig.keywords],
  authors = [...siteConfig.authors],
}: ConstructMetadataOptions = {}): Metadata {
  const isDefaultTitle = title === siteConfig.title;

  return {
    title: isDefaultTitle
      ? {
          default: siteConfig.title,
          template: `%s | ${siteConfig.name}`,
        }
      : title,
    description,
    keywords,
    authors,
    creator: siteConfig.creator,
    metadataBase: new URL(siteConfig.url),
    ...(canonicalUrl && {
      alternates: {
        canonical: canonicalUrl,
      },
    }),
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url: canonicalUrl || siteConfig.url,
      title: isDefaultTitle ? siteConfig.title : title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isDefaultTitle ? siteConfig.title : title,
      description,
      images: [image],
      creator: '@tansang',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons,
    manifest: '/site.webmanifest',
  };
}
