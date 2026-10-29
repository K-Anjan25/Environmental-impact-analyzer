import { useMemo } from 'react';
import { marked } from 'marked';
import SiteLayout from '../SiteLayout';
import { LEGAL_DOCS, LEGAL_DOC_IDS, type LegalDocId } from './legal-docs';

/** Renders one repository legal document inside the site shell. The source is our own files, not user input. */
export default function LegalPage({ doc }: { doc: LegalDocId }) {
  const { title, body } = LEGAL_DOCS[doc];
  // The page heading is the document title. A leading markdown title is dropped so it is not shown twice.
  const html = useMemo(() => {
    const text = body.replace(/^\s*#\s+[^\n]*\n+/, '');
    return marked.parse(text, { async: false, gfm: true }) as string;
  }, [body]);
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
        <div className="legal-body">
          <h1>{title}</h1>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </article>
    </SiteLayout>
  );
}
