import { SOCIAL_LINKS, GITHUB_URL, ISSUES_URL } from './content';

/*
 * Footer for the public landing pages. It has a brand block, product, company, and legal links,
 * and social links. It has no newsletter form and no map: no mailing list or office location is
 * configured yet, and an embedded map would send visitor IP addresses to a third party.
 */

export default function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="landing-footer" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">
        Site footer
      </h2>
      <div className="landing-footer-grid">
        <div className="footer-col footer-brand-col">
          <a className="site-brand" href="#/" aria-label="EcoImpact Lab home">
            <img src="/brand/mark.svg" alt="" />
            <span>EcoImpact Lab</span>
          </a>
          <p>Environmental Impact Analyzer. Published apparel and footwear process factors, with scope stated on every result.</p>
          <div className="social" aria-label="Social media">
            {SOCIAL_LINKS.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${item.label} (opens in a new tab)`}>
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <nav className="footer-col" aria-label="Product links">
          <h3>Product</h3>
          <ul>
            <li><a href="#/calculator">Calculator</a></li>
            <li><a href="#/method">Method and scope</a></li>
            <li><a href="#/pricing">Plans</a></li>
            <li><a href="#/blogs">Guides and news</a></li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Company links">
          <h3>Company</h3>
          <ul>
            <li><a href="#/contact">Contact</a></li>
            <li><a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">Report an issue (new tab)</a></li>
            <li><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">Source code (new tab)</a></li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Legal">
          <h3>Legal</h3>
          <ul>
            <li><a href="#/legal/terms">Terms of use</a></li>
            <li><a href="#/legal/privacy">Privacy policy</a></li>
            <li><a href="#/legal/software-license">Software license</a></li>
            <li><a href="#/legal/source-record">Carbonfact source record</a></li>
            <li><a href="#/legal/dataset-license">Dataset license</a></li>
          </ul>
        </nav>
      </div>
      <div className="landing-footer-base">
        <span>© {year} EcoImpact Lab. Published source data is licensed CC BY-SA 4.0.</span>
      </div>
    </footer>
  );
}
