import { POST_TYPE_SEGMENT, postTypeFromSegment, type PostType } from './posts';

export type Route =
  | { name: 'home' }
  | { name: 'calculator' }
  | { name: 'blog-index' }
  | { name: 'blog-type'; type: PostType }
  | { name: 'blog-post'; type: PostType; slug: string }
  | { name: 'admin-blogs' }
  | { name: 'not-found' };

/** Old guide links (#/guides/<slug>) map to the blog post type they now belong to. */
const LEGACY_GUIDE_TYPES: Record<string, PostType> = {
  factors: 'guide',
  indicators: 'explainer',
  scope: 'news',
};

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '');
  if (path === '' || path === 'top' || !path.startsWith('/')) return { name: 'home' };

  const parts = path
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'calculator' && parts.length === 1) return { name: 'calculator' };

  if (parts[0] === 'blogs') {
    if (parts.length === 1) return { name: 'blog-index' };
    const type = postTypeFromSegment(parts[1]);
    if (!type) return { name: 'not-found' };
    if (parts.length === 2) return { name: 'blog-type', type };
    if (parts.length === 3) return { name: 'blog-post', type, slug: parts[2] };
    return { name: 'not-found' };
  }

  if (parts[0] === 'guides' && parts[1]) {
    const type = LEGACY_GUIDE_TYPES[parts[1]];
    if (type) return { name: 'blog-post', type, slug: parts[1] };
    return { name: 'not-found' };
  }

  if (parts[0] === 'admin' && parts[1] === 'blogs' && parts.length === 2) return { name: 'admin-blogs' };

  return { name: 'not-found' };
}

export function routeHref(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'calculator':
      return '#/calculator';
    case 'blog-index':
      return '#/blogs';
    case 'blog-type':
      return `#/blogs/${POST_TYPE_SEGMENT[route.type]}`;
    case 'blog-post':
      return `#/blogs/${POST_TYPE_SEGMENT[route.type]}/${encodeURIComponent(route.slug)}`;
    case 'admin-blogs':
      return '#/admin/blogs';
    default:
      return '#/';
  }
}

/** Where a post card goes: external posts open their link, others open the post page. */
export function postHref(post: { type: PostType; slug: string; externalUrl?: string }): string {
  if (post.externalUrl) return post.externalUrl;
  return routeHref({ name: 'blog-post', type: post.type, slug: post.slug });
}
