import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const webDirectory = resolve(scriptDirectory, '..');
const repositoryDirectory = resolve(webDirectory, '../..');
const outputDirectory = resolve(webDirectory, 'public/legal');

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const renderer = new marked.Renderer();
renderer.html = ({ text }) => escapeHtml(text);

const pageLinks = {
  'PRIVACY.md': '/legal/privacy.html',
  'TERMS.md': '/legal/terms.html',
  'data-sources.md': '/legal/data-sources.html',
  'services/api/data/carbonfact-v1.1.0/SOURCE.md': '/legal/source-record.html',
  'services/api/data/carbonfact-v1.1.0/datasets/sources/SOURCE-RECORD.md': '/legal/supplementary-sources.html',
  '../../SOURCE.md': '/legal/source-record.html',
  '../../../../../../data-sources.md': '/legal/data-sources.html',
};

function rewriteDocumentLinks(html, sourcePath) {
  const links = { ...pageLinks };
  for (const [target, destination] of Object.entries(links)) {
    html = html.replaceAll(`href="${target}"`, `href="${destination}"`);
  }
  return html;
}

function wrapPage(title, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>${escapeHtml(title)} · EcoImpact Lab</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #000; background: #FFF6E0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: clamp(12px, 4vw, 48px); background: #FFF6E0; }
    main { max-width: 900px; margin: 0 auto; padding: clamp(20px, 4vw, 40px); background: #fff; border: 3px solid #000; box-shadow: 6px 6px 0 #000, 11px 11px 0 #5BE0A0; }
    nav { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 18px; border-bottom: 3px solid #000; font-size: 14px; }
    nav a, a { color: #000; text-underline-offset: 3px; }
    nav a { padding: 7px 10px; border: 2px solid #000; background: #fff; font-weight: 800; text-decoration: none; box-shadow: 2px 2px 0 #000; }
    nav a:hover { background: #FFD23F; }
    :focus-visible { outline: 3px solid #000; outline-offset: 3px; }
    h1, h2, h3 { color: #000; line-height: 1.15; font-weight: 900; }
    h1 { margin-top: 24px; font-size: clamp(28px, 5vw, 42px); letter-spacing: -.04em; }
    h2 { margin-top: 32px; padding-top: 12px; border-top: 3px solid #000; font-size: 22px; }
    h3 { margin-top: 24px; font-size: 17px; }
    p, li { max-width: 72ch; line-height: 1.65; }
    li + li { margin-top: 6px; }
    blockquote { margin-left: 0; padding: 10px 16px; border-left: 6px solid #000; background: #FFF0C2; }
    pre { overflow-x: auto; padding: 16px; background: #FFF6E0; border: 2px solid #000; white-space: pre-wrap; overflow-wrap: anywhere; font: 13px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace; }
    table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
    th, td { padding: 8px 10px; border: 2px solid #000; text-align: left; }
    th { background: #FFD23F; }
    footer { margin-top: 34px; padding: 14px 16px; border-top: 3px solid #000; background: #000; color: #fff; font-size: 12px; }
    @media (max-width: 560px) { body { padding: 10px; } main { padding: 20px 16px; } }
  </style>
</head>
<body>
  <main>
    <nav aria-label="Site and legal navigation">
      <a href="/">Calculator</a>
      <a href="/legal/privacy.html">Privacy</a>
      <a href="/legal/terms.html">Terms</a>
      <a href="/legal/data-sources.html">Data sources</a>
    </nav>
    ${content}
    <footer>EcoImpact Lab · Open-data process estimates</footer>
  </main>
</body>
</html>
`;
}

await mkdir(outputDirectory, { recursive: true });

const markdownPages = [
  { source: 'PRIVACY.md', output: 'privacy.html', title: 'Privacy notice' },
  { source: 'TERMS.md', output: 'terms.html', title: 'Terms of use' },
  { source: 'data-sources.md', output: 'data-sources.html', title: 'Data sources and scope' },
  { source: 'services/api/data/carbonfact-v1.1.0/datasets/sources/SOURCE-RECORD.md', output: 'supplementary-sources.html', title: 'Supplementary source record' },
  {
    source: 'services/api/data/carbonfact-v1.1.0/SOURCE.md',
    output: 'source-record.html',
    title: 'Carbonfact source record',
  },
];

for (const page of markdownPages) {
  const sourcePath = resolve(repositoryDirectory, page.source);
  const markdown = await readFile(sourcePath, 'utf8');
  const parsed = await marked.parse(markdown, { gfm: true, renderer });
  const content = rewriteDocumentLinks(parsed, page.source);
  await writeFile(resolve(outputDirectory, page.output), wrapPage(page.title, content));
}

