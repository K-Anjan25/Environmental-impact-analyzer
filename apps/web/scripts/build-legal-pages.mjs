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
  'LICENSE': '/legal/license.html',
  'data-sources.md': '/legal/data-sources.html',
  'services/api/data/carbonfact-v1.1.0/LICENSE': '/legal/source-license.html',
  'services/api/data/carbonfact-v1.1.0/SOURCE.md': '/legal/source-record.html',
};

function rewriteDocumentLinks(html, sourcePath) {
  const links = { ...pageLinks };
  if (sourcePath === 'services/api/data/carbonfact-v1.1.0/SOURCE.md') {
    links.LICENSE = '/legal/source-license.html';
  }
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
  <title>${escapeHtml(title)} · Environmental Impact Analyzer</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #263b31; background: #f4f1e9; }
    body { margin: 0; padding: clamp(18px, 5vw, 56px); }
    main { max-width: 860px; margin: 0 auto; padding: clamp(22px, 5vw, 48px); background: #fff; border: 1px solid #e4e7df; border-radius: 18px; box-shadow: 0 12px 40px rgb(35 57 43 / 7%); }
    nav { display: flex; flex-wrap: wrap; gap: 10px 18px; padding-bottom: 22px; border-bottom: 1px solid #e4e7df; font-size: 14px; }
    nav a, a { color: #245d47; text-underline-offset: 3px; }
    h1, h2, h3 { color: #223c2f; line-height: 1.25; }
    h1 { margin-top: 24px; font-size: clamp(28px, 5vw, 40px); letter-spacing: -.03em; }
    h2 { margin-top: 32px; font-size: 22px; }
    h3 { margin-top: 24px; font-size: 17px; }
    p, li { line-height: 1.7; }
    li + li { margin-top: 6px; }
    blockquote { margin-left: 0; padding: 2px 16px; border-left: 3px solid #779b78; color: #4c6155; background: #f4f7f1; }
    pre { overflow-x: auto; padding: 20px; background: #f5f6f2; border: 1px solid #e4e7df; border-radius: 10px; white-space: pre-wrap; overflow-wrap: anywhere; font: 13px/1.65 ui-monospace, SFMono-Regular, Consolas, monospace; }
    table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
    th, td { padding: 8px 10px; border: 1px solid #dce3da; text-align: left; }
    footer { margin-top: 34px; padding-top: 16px; border-top: 1px solid #e4e7df; color: #637169; font-size: 12px; }
    @media (max-width: 560px) { body { padding: 10px; } main { padding: 20px 16px; border-radius: 12px; } }
  </style>
</head>
<body>
  <main>
    <nav aria-label="Site and legal navigation">
      <a href="/">Calculator</a>
      <a href="/legal/privacy.html">Privacy</a>
      <a href="/legal/terms.html">Terms</a>
      <a href="/legal/license.html">Software license</a>
      <a href="/legal/data-sources.html">Data sources</a>
    </nav>
    ${content}
    <footer>Environmental Impact Analyzer · Open-data process estimates</footer>
  </main>
</body>
</html>
`;
}

await mkdir(outputDirectory, { recursive: true });

const markdownPages = [
  { source: 'PRIVACY.md', output: 'privacy.html', title: 'Privacy notice' },
  { source: 'TERMS.md', output: 'terms.html', title: 'Terms of use' },
  { source: 'data-sources.md', output: 'data-sources.html', title: 'Open-data source record' },
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

const licenseText = await readFile(resolve(repositoryDirectory, 'LICENSE'), 'utf8');
const sourceLicenseText = await readFile(
  resolve(repositoryDirectory, 'services/api/data/carbonfact-v1.1.0/LICENSE'),
  'utf8',
);

const softwareLicensePage = `<h1>Software license</h1>
<p>The MIT License below applies to original application code and project documentation only. It does not relicense the Carbonfact dataset or other third-party material. See the <a href="/legal/data-sources.html">data-source record</a> and <a href="/legal/source-license.html">dataset license</a>.</p>
<pre>${escapeHtml(licenseText)}</pre>`;
const datasetLicensePage = `<h1>Carbonfact dataset license</h1>
<p>The following license applies to the bundled Carbonfact v1.1.0 dataset materials and dataset-derived results as described in the <a href="/legal/source-record.html">source record</a>.</p>
<pre>${escapeHtml(sourceLicenseText)}</pre>`;

await writeFile(resolve(outputDirectory, 'license.html'), wrapPage('Software license', softwareLicensePage));
await writeFile(
  resolve(outputDirectory, 'source-license.html'),
  wrapPage('Carbonfact dataset license', datasetLicensePage),
);
