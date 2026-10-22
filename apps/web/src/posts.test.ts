// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import {
  EMPTY_POST_INPUT,
  createPost,
  deletePost,
  findPost,
  loadPosts,
  publishedPosts,
  slugify,
  updatePost,
  validatePostInput,
  type PostInput,
} from './posts';
import { parseRoute, postHref } from './router';

const input = (overrides: Partial<PostInput> = {}): PostInput => ({
  ...EMPTY_POST_INPUT,
  type: 'news',
  title: 'Factory update on dyeing',
  summary: 'A short summary.',
  body: 'First paragraph.\n\nSecond paragraph.',
  status: 'published',
  ...overrides,
});

describe('post store', () => {
  beforeEach(() => window.localStorage.clear());

  it('seeds the three existing guides, one per type', () => {
    const posts = loadPosts();
    expect(posts.map((post) => post.type).sort()).toEqual(['explainer', 'guide', 'news']);
    expect(findPost('guide', 'factors')?.title).toContain('process factor');
  });

  it('creates, updates, and deletes a post', () => {
    const created = createPost(input());
    expect(created.slug).toBe('factory-update-on-dyeing');
    expect(created.body).toEqual(['First paragraph.', 'Second paragraph.']);
    expect(findPost('news', created.slug)?.id).toBe(created.id);

    const updated = updatePost(created.id, input({ title: 'Factory update on dyeing, revised', externalUrl: 'https://example.org/news' }));
    expect(updated.slug).toBe(created.slug);
    expect(updated.externalUrl).toBe('https://example.org/news');
    expect(loadPosts().find((post) => post.id === created.id)?.title).toBe('Factory update on dyeing, revised');

    deletePost(created.id);
    expect(loadPosts().some((post) => post.id === created.id)).toBe(false);
  });

  it('gives duplicate titles of one type unique slugs', () => {
    const first = createPost(input());
    const second = createPost(input());
    expect(second.slug).toBe(`${first.slug}-2`);
  });

  it('hides drafts from public lists and lookups', () => {
    const draft = createPost(input({ status: 'draft', title: 'Unpublished resource' }));
    expect(publishedPosts('news').some((post) => post.id === draft.id)).toBe(false);
    expect(findPost('news', draft.slug)).toBeUndefined();
    expect(findPost('news', draft.slug, { includeDrafts: true })?.id).toBe(draft.id);
  });

  it('ignores stored data that is not a post', () => {
    window.localStorage.setItem('ecoimpact.posts.v1', JSON.stringify([{ nope: true }, null]));
    expect(loadPosts()).toEqual([]);
  });
});

describe('post validation', () => {
  it('requires a title, summary, and text', () => {
    const errors = validatePostInput(input({ title: ' ', summary: '', body: '  ' }));
    expect(errors.title).toBeTruthy();
    expect(errors.summary).toBeTruthy();
    expect(errors.body).toBeTruthy();
  });

  it('accepts only http and https external links', () => {
    expect(validatePostInput(input({ externalUrl: 'https://example.org/a' })).externalUrl).toBeUndefined();
    expect(validatePostInput(input({ externalUrl: 'javascript:alert(1)' })).externalUrl).toBeTruthy();
    expect(validatePostInput(input({ externalUrl: 'not a link' })).externalUrl).toBeTruthy();
  });

  it('keeps empty optional fields empty', () => {
    expect(validatePostInput(input({ externalUrl: '', image: '' }))).toEqual({});
  });

  it('slugifies titles', () => {
    expect(slugify('Café & Co: 2026 results!')).toBe('cafe-co-2026-results');
    expect(slugify('!!!')).toBe('post');
  });
});

describe('routes', () => {
  it('maps blog types to their own routes', () => {
    expect(parseRoute('#/blogs')).toEqual({ name: 'blog-index' });
    expect(parseRoute('#/blogs/news')).toEqual({ name: 'blog-type', type: 'news' });
    expect(parseRoute('#/blogs/guides')).toEqual({ name: 'blog-type', type: 'guide' });
    expect(parseRoute('#/blogs/explainers/indicators')).toEqual({ name: 'blog-post', type: 'explainer', slug: 'indicators' });
    expect(parseRoute('#/blogs/unknown')).toEqual({ name: 'not-found' });
  });

  it('keeps the calculator, hidden admin, and legacy guide links', () => {
    expect(parseRoute('#/calculator')).toEqual({ name: 'calculator' });
    expect(parseRoute('#/admin/posts')).toEqual({ name: 'admin-posts' });
    expect(parseRoute('#/guides/scope')).toEqual({ name: 'blog-post', type: 'news', slug: 'scope' });
    expect(parseRoute('#top')).toEqual({ name: 'home' });
    expect(parseRoute('')).toEqual({ name: 'home' });
  });

  it('opens external posts at their link and internal posts at their page', () => {
    expect(postHref({ type: 'news', slug: 'x', externalUrl: 'https://example.org/a' })).toBe('https://example.org/a');
    expect(postHref({ type: 'news', slug: 'x' })).toBe('#/blogs/news/x');
  });
});
