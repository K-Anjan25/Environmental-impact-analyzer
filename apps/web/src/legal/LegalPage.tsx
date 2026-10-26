import { useMemo } from 'react';
import { marked } from 'marked';
import SiteLayout from '../SiteLayout';
import { LEGAL_DOCS, LEGAL_DOC_IDS, type LegalDocId } from './legal-docs';

/** Renders one repository legal document inside the site shell. The source is our own files, not user input. */
export default function LegalPage({ doc }: { doc: LegalDocId }) {
  const { body } = LEGAL_DOCS[doc];
  const html = useMemo(() => marked.parse(body, { async: false, gfm: true }) as string, [body]);
  return (
    <SiteLayout current="home" variant="landing">
      <article className="legal-page">
        <nav className="legal-tabs" aria-label="Legal documents">
          {LEGAL_DOC_IDS.map((id) => (
            <a key={id} href={`#/legal/${id}`} aria-current={id === doc ? 'page' : undefined}>
              {LEGAL_DOCS[id].title}
            </a>
          ))}
        </nav>
        <div className="legal-body" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </SiteLayout>
  );
}
