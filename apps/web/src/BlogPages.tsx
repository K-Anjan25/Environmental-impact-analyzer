import { useEffect, useState } from 'react';
import SiteLayout from './SiteLayout';
import {
  POST_TYPES,
  POST_TYPE_LABEL,
  POST_TYPE_PLURAL,
  POST_TYPE_SEGMENT,
  POSTS_CHANGED_EVENT,
  findPost,
  publishedPosts,
  type Post,
  type PostType,
} from './posts';
import { postHref, routeHref } from './router';

/** Re-reads the post store when posts change in this window or another tab. */
function usePublishedPosts(type?: PostType): Post[] {
  const [posts, setPosts] = useState(() => publishedPosts(type));
  useEffect(() => {
    const refresh = () => setPosts(publishedPosts(type));
    window.addEventListener(POSTS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(POSTS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [type]);
  return posts;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function PostCard({ post }: { post: Post }) {
  const href = postHref(post);
  const external = Boolean(post.externalUrl);
  return (
    <article className="post-card">
      {post.image ? (
        <div className="post-card-media">
          <img src={post.image} alt="" loading="lazy" />
        </div>
      ) : null}
      <div className="post-card-body">
        <p className="post-card-kicker">
          {POST_TYPE_LABEL[post.type]}
          {external ? ' · External link' : ''}
        </p>
        <h2 className="post-card-title">
          <a
            className="post-card-link"
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {post.title}
            {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
          </a>
        </h2>
        <p className="post-card-summary">{post.summary}</p>
        {external ? <p className="post-card-source">Source: {hostOf(post.externalUrl as string)}</p> : null}
      </div>
    </article>
  );
}

function BlogTabs({ current }: { current: PostType | 'all' }) {
  return (
    <nav className="blog-tabs" aria-label="Blog types">
      <a href="#/blogs" aria-current={current === 'all' ? 'page' : undefined}>All blogs</a>
      {POST_TYPES.map((type) => (
        <a key={type} href={routeHref({ name: 'blog-type', type })} aria-current={current === type ? 'page' : undefined}>
          {POST_TYPE_PLURAL[type]}
        </a>
      ))}
    </nav>
  );
}

export function BlogIndexPage() {
  const posts = usePublishedPosts();
  return (
    <SiteLayout current="blogs">
      <div className="blog-page">
        <header className="page-heading">
          <p className="landing-eyebrow">BLOGS</p>
          <h1 className="page-title">Guides, explainers, and news.</h1>
          <p className="page-lede">Read how the calculator works, how to read its indicators, and what its results do and do not cover.</p>
        </header>
        <BlogTabs current="all" />
        {posts.length ? (
          <div className="post-grid" id="all-blogs-list">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <p className="blog-empty">No blogs published yet.</p>
        )}
      </div>
    </SiteLayout>
  );
}

export function BlogTypePage({ type }: { type: PostType }) {
  const posts = usePublishedPosts(type);
  return (
    <SiteLayout current="blogs">
      <div className="blog-page">
        <header className="page-heading">
          <p className="landing-eyebrow">{POST_TYPE_PLURAL[type].toUpperCase()}</p>
          <h1 className="page-title">{POST_TYPE_PLURAL[type]}</h1>
        </header>
        <BlogTabs current={type} />
        {posts.length ? (
          <div className="post-grid" id={`${POST_TYPE_SEGMENT[type]}-list`}>
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <p className="blog-empty">No {POST_TYPE_PLURAL[type].toLowerCase()} published yet.</p>
        )}
      </div>
    </SiteLayout>
  );
}

export function BlogPostPage({ type, slug }: { type: PostType; slug: string }) {
  const [post, setPost] = useState(() => findPost(type, slug));
  useEffect(() => {
    const refresh = () => setPost(findPost(type, slug));
    window.addEventListener(POSTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(POSTS_CHANGED_EVENT, refresh);
  }, [type, slug]);

  if (!post) {
    return (
      <SiteLayout current="blogs">
        <div className="blog-page">
          <header className="page-heading">
            <h1 className="page-title">Blog not found</h1>
            <p className="page-lede">This blog may have been unpublished or moved.</p>
            <a className="landing-cta" href={routeHref({ name: 'blog-type', type })}>Back to {POST_TYPE_PLURAL[type].toLowerCase()}</a>
          </header>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout current="blogs">
      <article className="blog-page post-page">
        <a className="post-back" href={routeHref({ name: 'blog-type', type })}>← All {POST_TYPE_PLURAL[type].toLowerCase()}</a>
        <p className="landing-eyebrow">{POST_TYPE_LABEL[type].toUpperCase()}</p>
        <h1 className="page-title">{post.title}</h1>
        <p className="page-lede">{post.summary}</p>
        {post.image ? (
          <figure className="post-figure">
            <img src={post.image} alt={post.imageAlt ?? ''} />
          </figure>
        ) : null}
        <div className="post-body">
          {post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        {post.externalUrl ? (
          <p className="post-external">
            <a className="landing-cta" href={post.externalUrl} target="_blank" rel="noopener noreferrer">
              Read the source at {hostOf(post.externalUrl)}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        ) : null}
      </article>
    </SiteLayout>
  );
}
