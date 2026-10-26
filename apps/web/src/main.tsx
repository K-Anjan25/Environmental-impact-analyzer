import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App';
import AdminBlogsPage from './AdminBlogsPage';
import LandingPage from './LandingPage';
import { ContactPage, MethodPage, PricingPage } from './marketing/MarketingPages';
import { BlogIndexPage, BlogPostPage, BlogTypePage } from './BlogPages';
import SiteLayout from './SiteLayout';
import { parseRoute, routeHref, type Route } from './router';
import theme from './theme';
import './styles.css';
import './marketing/marketing.css';
import './neo-theme.css';

function currentHash(): string {
  return window.location.hash;
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <LandingPage />;
    case 'method':
      return <MethodPage />;
    case 'pricing':
      return <PricingPage />;
    case 'contact':
      return <ContactPage />;
    case 'calculator':
      return <App />;
    case 'blog-index':
      return <BlogIndexPage />;
    case 'blog-type':
      return <BlogTypePage type={route.type} />;
    case 'blog-post':
      return <BlogPostPage type={route.type} slug={route.slug} />;
    case 'admin-blogs':
      return <AdminBlogsPage />;
    default:
      return (
        <SiteLayout current="home">
          <div className="blog-page">
            <header className="page-heading">
              <h1 className="page-title">Page not found</h1>
              <p className="page-lede">The page you asked for does not exist.</p>
              <a className="landing-cta" href="#/">Back to the home page</a>
            </header>
          </div>
        </SiteLayout>
      );
  }
}

function Root() {
  const [hash, setHash] = useState(currentHash);

  useEffect(() => {
    const onChange = () => {
      const next = currentHash();
      // Old guide links redirect to their blog post URL.
      const route = parseRoute(next);
      if (route.name === 'blog-post' && next.startsWith('#/guides/')) {
        window.location.replace(routeHref(route));
        return;
      }
      setHash(next);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return <RouteView route={parseRoute(hash)} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Root />
    </ThemeProvider>
  </React.StrictMode>,
);
