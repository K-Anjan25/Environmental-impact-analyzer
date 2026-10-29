import type { ReactNode } from 'react';
import SiteMenu from './SiteMenu';
import LandingFooter from './marketing/LandingFooter';

export type SiteSection = 'home' | 'calculator' | 'blogs' | 'method' | 'pricing' | 'contact';

type SiteLayoutProps = {
  current: SiteSection;
  /**
   * standard: the calculator and blog shell, with a visible top navigation and the simple footer.
   * landing: the public marketing shell. Same header as standard, plus the open-calculator button.
   */
  variant?: 'standard' | 'landing';
  sourceVersion?: string;
  totalRecords?: number | string;
  children: ReactNode;
};

const NAV_ITEMS: { id: SiteSection; href: string; label: string }[] = [
  { id: 'home', href: '#/', label: 'Home' },
  { id: 'calculator', href: '#/calculator', label: 'Calculator' },
  { id: 'blogs', href: '#/blogs', label: 'Blogs' },
];

export default function SiteLayout({ current, variant = 'standard', children }: SiteLayoutProps) {
  const landing = variant === 'landing';
  return (
    <div className={`site-layout${landing ? ' site-layout-landing' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-topbar">
        <div className="site-topbar-start">
          <SiteMenu />
          <a className="site-brand" href="#/" aria-label="EcoImpact Lab home">
            <img src="/brand/mark.svg" alt="" />
            <span>EcoImpact Lab</span>
          </a>
        </div>
        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a key={item.id} href={item.href} aria-current={current === item.id ? 'page' : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="site-topbar-end">
          {landing && <a className="site-cta" href="#/calculator">Open calculator</a>}
        </div>
      </header>
      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
