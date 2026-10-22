/*
 * Blog posts: one store for guides, explainers, and news.
 * Posts live in localStorage for now, so CRUD works in the browser without a server.
 * The admin screen that edits them is hidden (route #/admin/posts, not linked from any menu).
 */

export type PostType = 'guide' | 'explainer' | 'news';
export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  type: PostType;
  slug: string;
  title: string;
  summary: string;
  /** Paragraphs of the post body, shown on the post page. */
  body: string[];
  image?: string;
  imageAlt?: string;
  /** Optional external link, for news items and online resources. Must be http or https. */
  externalUrl?: string;
  status: PostStatus;
  updatedAt: string;
}

export interface PostInput {
  type: PostType;
  title: string;
  summary: string;
  body: string;
  image: string;
  imageAlt: string;
  externalUrl: string;
  status: PostStatus;
}

export type PostErrors = Partial<Record<keyof PostInput, string>>;

export const POST_TYPES: PostType[] = ['guide', 'explainer', 'news'];

export const POST_TYPE_LABEL: Record<PostType, string> = {
  guide: 'Guide',
  explainer: 'Explainer',
  news: 'News',
};

/** URL segment for each post type: #/blogs/guides, #/blogs/explainers, #/blogs/news. */
export const POST_TYPE_SEGMENT: Record<PostType, string> = {
  guide: 'guides',
  explainer: 'explainers',
  news: 'news',
};

export const POST_TYPE_PLURAL: Record<PostType, string> = {
  guide: 'Guides',
  explainer: 'Explainers',
  news: 'News',
};

export function postTypeFromSegment(segment: string): PostType | undefined {
  return POST_TYPES.find((type) => POST_TYPE_SEGMENT[type] === segment);
}

export const POSTS_STORAGE_KEY = 'ecoimpact.posts.v1';
export const POSTS_CHANGED_EVENT = 'ecoimpact:posts-changed';

const SEED_POSTS: Post[] = [
  {
    id: 'seed-guide-factors',
    type: 'guide',
    slug: 'factors',
    title: 'How a process factor becomes a number',
    summary: 'A published factor pairs a process with a reference unit. Here is how a quantity you enter becomes an indicator value.',
    body: [
      'Each published factor pairs a process with a reference unit, such as one kilogram of material or one piece of product.',
      'When you enter a quantity, the calculator converts it to that reference unit and multiplies it by the factor for each indicator. Check the unit shown next to each factor before you enter a quantity.',
    ],
    image: '/images/recycling-globe.jpg',
    imageAlt: 'Illustration of a recycling globe.',
    status: 'published',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'seed-explainer-indicators',
    type: 'explainer',
    slug: 'indicators',
    title: 'Reading the 16 EF 3.1 indicators',
    summary: 'The 16 impact categories, why each has its own unit, and why values are not added together.',
    body: [
      'The Environmental Footprint 3.1 method reports 16 impact categories, including climate change, water use, land use, and resource use.',
      'Each indicator has its own unit, so values cannot be added together or ranked across indicators without a separate weighting step. The results table shows each indicator on its own line.',
    ],
    image: '/images/recycling-icon.jpg',
    imageAlt: 'Recycling icon.',
    status: 'published',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'seed-news-scope',
    type: 'news',
    slug: 'scope',
    title: 'Why results are not whole-product footprints',
    summary: 'The calculator sums the processes you select. It does not model every supplier, transport leg, or use phase of a finished item.',
    body: [
      'This tool sums the processes you select. It does not model every upstream supplier, transport leg, use phase, or end-of-life step for a finished item.',
      'Treat a result as the impact of the processes you chose, and state that scope whenever you share it.',
    ],
    image: '/images/recycling-tshirt-cropped.jpg',
    imageAlt: 'Illustration of a green recycling T-shirt held in a hand, with leaves and a hanger.',
    status: 'published',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isPost(value: unknown): value is Post {
  if (!value || typeof value !== 'object') return false;
  const post = value as Post;
  return (
    typeof post.id === 'string' &&
    POST_TYPES.includes(post.type) &&
    typeof post.slug === 'string' &&
    typeof post.title === 'string' &&
    Array.isArray(post.body) &&
    (post.status === 'draft' || post.status === 'published')
  );
}

export function loadPosts(): Post[] {
  const store = storage();
  const raw = store?.getItem(POSTS_STORAGE_KEY);
  if (!raw) return SEED_POSTS.map((post) => ({ ...post, body: [...post.body] }));
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPost) : [];
  } catch {
    return [];
  }
}

export function savePosts(posts: Post[]): void {
  const store = storage();
  store?.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(POSTS_CHANGED_EVENT));
}

export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';
}

function uniqueSlug(posts: Post[], type: PostType, base: string, ignoreId?: string): string {
  const taken = new Set(posts.filter((post) => post.type === type && post.id !== ignoreId).map((post) => post.slug));
  if (!taken.has(base)) return base;
  let counter = 2;
  while (taken.has(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

export function validatePostInput(input: PostInput): PostErrors {
  const errors: PostErrors = {};
  if (!POST_TYPES.includes(input.type)) errors.type = 'Choose a post type.';
  if (!input.title.trim()) errors.title = 'Enter a title.';
  if (input.title.trim().length > 140) errors.title = 'Keep the title under 140 characters.';
  if (!input.summary.trim()) errors.summary = 'Enter a short summary.';
  if (!input.body.trim()) errors.body = 'Enter the post text. Separate paragraphs with a blank line.';
  const url = input.externalUrl.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') errors.externalUrl = 'Use an http or https link.';
    } catch {
      errors.externalUrl = 'Enter a full link, such as https://example.org/article.';
    }
  }
  if (input.image.trim() && !input.image.trim().startsWith('/') && !/^https?:\/\//.test(input.image.trim())) {
    errors.image = 'Use a site path such as /images/cover.jpg, or a full https link.';
  }
  return errors;
}

function paragraphsFrom(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function recordFrom(input: PostInput, id: string, slug: string): Post {
  const url = input.externalUrl.trim();
  const image = input.image.trim();
  return {
    id,
    type: input.type,
    slug,
    title: input.title.trim(),
    summary: input.summary.trim(),
    body: paragraphsFrom(input.body),
    image: image || undefined,
    imageAlt: input.imageAlt.trim() || undefined,
    externalUrl: url ? new URL(url).toString() : undefined,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };
}

export function createPost(input: PostInput): Post {
  const posts = loadPosts();
  const id = `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const slug = uniqueSlug(posts, input.type, slugify(input.title));
  const post = recordFrom(input, id, slug);
  savePosts([...posts, post]);
  return post;
}

export function updatePost(id: string, input: PostInput): Post {
  const posts = loadPosts();
  const existing = posts.find((post) => post.id === id);
  if (!existing) throw new Error('That post no longer exists.');
  const slug = existing.type === input.type && existing.slug
    ? existing.slug
    : uniqueSlug(posts, input.type, slugify(input.title), id);
  const post = recordFrom(input, id, slug);
  savePosts(posts.map((item) => (item.id === id ? post : item)));
  return post;
}

export function deletePost(id: string): void {
  savePosts(loadPosts().filter((post) => post.id !== id));
}

export function publishedPosts(type?: PostType): Post[] {
  return loadPosts()
    .filter((post) => post.status === 'published' && (!type || post.type === type))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function findPost(type: PostType, slug: string, options: { includeDrafts?: boolean } = {}): Post | undefined {
  return loadPosts().find(
    (post) => post.type === type && post.slug === slug && (options.includeDrafts || post.status === 'published'),
  );
}

export function postToInput(post: Post): PostInput {
  return {
    type: post.type,
    title: post.title,
    summary: post.summary,
    body: post.body.join('\n\n'),
    image: post.image ?? '',
    imageAlt: post.imageAlt ?? '',
    externalUrl: post.externalUrl ?? '',
    status: post.status,
  };
}

export const EMPTY_POST_INPUT: PostInput = {
  type: 'news',
  title: '',
  summary: '',
  body: '',
  image: '',
  imageAlt: '',
  externalUrl: '',
  status: 'draft',
};
