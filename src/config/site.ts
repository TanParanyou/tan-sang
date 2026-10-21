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
  name: 'Tan-Sang (ทันสั่ง)',
  shortName: 'ทันสั่ง',
  title: 'Tan-Sang (ทันสั่ง) — ระบบเปิดบิลสั่งอาหารกลุ่มผ่าน LINE',
  description:
    'สั่งอาหารกลุ่มในแชท LINE เลือกเมนู ท็อปปิ้ง แยกบิลรายคน และคัดลอกข้อความส่งร้านในคลิกเดียว',
  url: getAppUrl(),
  ogImage: '/og.png',
  keywords: [
    'ทันสั่ง',
    'Tan-Sang',
    'สั่งอาหารกลุ่ม',
    'LINE LIFF',
    'เปิดบิลสั่งอาหาร',
    'หารค่าข้าว',
    'แยกบิล',
    'LINE Bot',
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
  icons?: string;
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
  icons = '/favicon.ico',
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
