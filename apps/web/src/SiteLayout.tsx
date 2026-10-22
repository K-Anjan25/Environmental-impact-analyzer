import type { ReactNode } from 'react';
import SiteMenu from './SiteMenu';

export type SiteSection = 'home' | 'calculator' | 'blogs';

type SiteLayoutProps = {
  current: SiteSection;
  sourceVersion?: string;
  totalRecords?: number | string;
  children: ReactNode;
};

const NAV_ITEMS: { id: SiteSection; href: string; label: string }[] = [
  { id: 'home', href: '#/', label: 'Home' },
  { id: 'calculator', href: '#/calculator', label: 'Calculator' },
  { id: 'blogs', href: '#/blogs', label: 'Blogs' },
];

export default function SiteLayout({ current, sourceVersion, totalRecords, children }: SiteLayoutProps) {
  return (
    <div className="site-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-topbar">
        <a className="site-brand" href="#/" aria-label="EcoImpact Lab home">
          <img src="/brand/mark.svg" alt="" />
          <span>EcoImpact Lab</span>
        </a>
        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a key={item.id} href={item.href} aria-current={current === item.id ? 'page' : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <SiteMenu sourceVersion={sourceVersion} totalRecords={totalRecords} />
      </header>
      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <img src="/brand/mark.svg" alt="" />
          <div>
            <strong>EcoImpact Lab</strong>
            <span>Apparel &amp; footwear process data</span>
          </div>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          <a href="#/calculator">Calculator</a>
          <a href="#/blogs">Blogs</a>
          <a href="/legal/terms.html">Terms of use</a>
          <a href="/legal/privacy.html">Privacy policy</a>
        </nav>
      </div>
    </footer>
  );
}
