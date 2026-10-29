import { useEffect, useState } from 'react';
import { getFactorCatalog, type FactorCatalog } from '../api';
import { FALLBACK_FACTOR_COUNT, FALLBACK_GROUP_COUNT } from './content';

/*
 * Shared data for the public pages.
 * The counts come from the live catalog when it loads. Until then, and if the request fails,
 * the verified fallbacks from the bundled data are used, so the page never shows an empty number.
 */

export type CatalogSummary = {
  totalRecords: number;
  groups: number;
  sourceVersion: string;
  loaded: boolean;
};

export function useCatalogSummary(): CatalogSummary {
  const [catalog, setCatalog] = useState<FactorCatalog | null>(null);

  useEffect(() => {
    let current = true;
    getFactorCatalog()
      .then((response) => {
        if (current) setCatalog(response);
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, []);

  return {
    totalRecords: catalog?.total_records ?? FALLBACK_FACTOR_COUNT,
    groups: catalog?.families.length ?? FALLBACK_GROUP_COUNT,
    sourceVersion: catalog?.source_version ?? '1.1.0',
    loaded: catalog !== null,
  };
}

/** Sets the document title and meta description for the current public page. Runs on mount. */
export function useDocumentMeta(title: string, description: string): void {
  useEffect(() => {
    document.title = `${title} · EcoImpact Lab`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [title, description]);
}
