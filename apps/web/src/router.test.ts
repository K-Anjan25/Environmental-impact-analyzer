import { describe, expect, it } from 'vitest';
import { parseRoute, routeHref } from './router';

describe('public page routes', () => {
  it('maps each marketing path to its own route', () => {
    expect(parseRoute('#/')).toEqual({ name: 'home' });
    expect(parseRoute('#/method')).toEqual({ name: 'method' });
    expect(parseRoute('#/pricing')).toEqual({ name: 'pricing' });
    expect(parseRoute('#/contact')).toEqual({ name: 'contact' });
    expect(parseRoute('#/calculator')).toEqual({ name: 'calculator' });
  });

  it('does not treat unknown or nested marketing paths as a page', () => {
    expect(parseRoute('#/method/extra').name).toBe('not-found');
    expect(parseRoute('#/contact/x').name).toBe('not-found');
    expect(parseRoute('#/stats').name).toBe('not-found');
  });

  it('builds hrefs that round-trip through parseRoute', () => {
    for (const route of [{ name: 'method' }, { name: 'pricing' }, { name: 'contact' }] as const) {
      expect(parseRoute(routeHref(route))).toEqual(route);
    }
  });
});
