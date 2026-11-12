/**
 * Global site data: brand, navigation, contact and social links.
 * Edit here to change the header, footer and default SEO in one place.
 */

export const site = {
  name: 'Zypher Agency',
  shortName: 'Zypher',
  titleSuffix: ' | Zypher Agency',
  description:
    'Zypher is a digital design & development agency. We design and build product sites, web apps, and brand systems for ambitious teams.',
  keywords: 'creative agency, photography, branding, design studio, web design, portfolio',
  locale: 'en_US',
  lang: 'en',
  email: 'hello@zypher.example',
  defaultOgImage: '/og-image.jpg',
  themeColor: '#ffffff',
  copyrightYear: 2026,
  /** Profiles listed in the Organization JSON-LD (`sameAs`). */
  sameAs: ['https://x.com/zypheragency', 'https://instagram.com/zypheragency'],
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: 'Benefits', href: '/benefits' },
  { label: 'Services', href: '/services' },
  { label: 'Portfolios', href: '/portfolios' },
  { label: 'Faq', href: '/faq' },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: 'Studio',
    links: [
      { label: 'Benefits', href: '/benefits' },
      { label: 'Services', href: '/services' },
      { label: 'Portfolios', href: '/portfolios' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
];

export type SocialIcon = 'instagram' | 'twitter' | 'globe';

export interface SocialLink extends NavLink {
  icon: SocialIcon;
}

export const socials: SocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
  { label: 'Twitter', href: 'https://twitter.com', icon: 'twitter' },
  { label: 'Behance', href: 'https://behance.net', icon: 'globe' },
];
