import type { ReactNode } from 'react';
import SiteMenu from './SiteMenu';
import LandingFooter from './marketing/LandingFooter';
import { SITE_NAV_ITEMS, type SiteSection } from './site-navigation';

export type { SiteSection } from './site-navigation';

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

export default function SiteLayout({ current, variant = 'standard', children }: SiteLayoutProps) {
  const landing = variant === 'landing';
  return (
    <div className={`site-layout${landing ? ' site-layout-landing' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-topbar">
        <div className="site-topbar-start">
          <a className="site-brand" href="#/" aria-label="EcoImpact Lab home">
            <img src="/brand/mark.svg" alt="" />
            <span>EcoImpact Lab</span>
          </a>
          <SiteMenu current={current} />
        </div>
        <nav className="site-nav" aria-label="Primary">
          {SITE_NAV_ITEMS.map((item) => (
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
