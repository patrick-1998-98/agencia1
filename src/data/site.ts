/**
 * Global site data: brand, navigation, contact and social links.
 * Edit here to change the header, footer and default SEO in one place.
 */

export const site = {
  name: 'Zypher Agency',
  shortName: 'Zypher',
  titleSuffix: ' | Zypher Agency',
  description:
    'Zypher es una agencia de diseño y desarrollo digital. Diseñamos y construimos sitios de producto, web apps y sistemas de marca para equipos ambiciosos.',
  keywords: 'agencia creativa, fotografía, branding, estudio de diseño, diseño web, portfolio',
  locale: 'es_AR',
  lang: 'es',
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
  { label: 'Beneficios', href: '/benefits' },
  { label: 'Servicios', href: '/services' },
  { label: 'Portfolio', href: '/portfolios' },
  { label: 'FAQ', href: '/faq' },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: 'Estudio',
    links: [
      { label: 'Beneficios', href: '/benefits' },
      { label: 'Servicios', href: '/services' },
      { label: 'Portfolio', href: '/portfolios' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Preguntas frecuentes', href: '/faq' },
      { label: 'Contacto', href: '/contact' },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: 'Privacidad', href: '/privacy' },
  { label: 'Términos', href: '/terms' },
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
