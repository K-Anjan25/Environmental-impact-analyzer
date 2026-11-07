export const SITE_NAV_ITEMS = [
  { id: 'home', href: '#/', label: 'Home' },
  { id: 'calculator', href: '#/calculator', label: 'Calculator' },
  { id: 'method', href: '#/method', label: 'Method' },
  { id: 'blogs', href: '#/blogs', label: 'Blogs' },
  { id: 'pricing', href: '#/pricing', label: 'Plans' },
  { id: 'contact', href: '#/contact', label: 'Contact' },
] as const;

export type SiteSection = (typeof SITE_NAV_ITEMS)[number]['id'];
