import { useEffect, useState, type FormEvent } from 'react';
import SiteLayout from './SiteLayout';
import {
  EMPTY_POST_INPUT,
  POST_TYPES,
  POST_TYPE_PLURAL,
  POSTS_CHANGED_EVENT,
  createPost,
  deletePost,
  loadPosts,
  postToInput,
  updatePost,
  validatePostInput,
  type Post,
  type PostErrors,
  type PostInput,
} from './posts';
import { postHref } from './router';

/*
 * Post editor: create, edit, and delete blog posts (guides, explainers, and news).
 * This page is hidden for now. It is not linked from the menu or footer.
 */
export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<Post[]>(() => loadPosts());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PostInput>(EMPTY_POST_INPUT);
  const [errors, setErrors] = useState<PostErrors>({});
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const previous = document.title;
    document.title = 'Manage blogs · EcoImpact Lab';
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !robots;
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    const previousContent = robots.content;
    robots.content = 'noindex, nofollow';
    const refresh = () => setPosts(loadPosts());
    window.addEventListener(POSTS_CHANGED_EVENT, refresh);
    return () => {
      document.title = previous;
      window.removeEventListener(POSTS_CHANGED_EVENT, refresh);
      if (created) robots?.remove();
      else if (robots) robots.content = previousContent;
    };
  }, []);

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY_POST_INPUT);
    setErrors({});
    setSaveError('');
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validatePostInput(form);
    setErrors(found);
    setSaveError('');
    setMessage('');
    if (Object.keys(found).length > 0) {
      setSaveError('Fix the highlighted fields, then save again.');
      return;
    }
    try {
      if (editingId) {
        updatePost(editingId, form);
        setMessage('Blog updated.');
      } else {
        createPost(form);
        setMessage('Blog created.');
      }
      setPosts(loadPosts());
      reset();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The blog could not be saved.');
    }
  };

  const edit = (post: Post) => {
    setEditingId(post.id);
    setForm(postToInput(post));
    setErrors({});
    setSaveError('');
    setMessage('');
    document.getElementById('post-form-heading')?.scrollIntoView({ block: 'start' });
  };

  const remove = (post: Post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    deletePost(post.id);
    if (editingId === post.id) reset();
    setPosts(loadPosts());
    setMessage('Blog deleted.');
  };

  const describedBy = (key: keyof PostInput) => (errors[key] ? `${key}-error` : undefined);

  return (
    <SiteLayout current="blogs">
      <div className="blog-page admin-page">
        <header className="page-heading">
          <p className="landing-eyebrow">BLOG MANAGEMENT</p>
          <h1 className="page-title">Manage blogs</h1>
          <p className="page-lede">Create, edit, and delete blogs: guides, explainers, and news. Published blogs appear on the blog pages. Drafts stay hidden.</p>
        </header>

        <div role="status" aria-live="polite" className="admin-status">{message}</div>

        <section className="admin-form-section" aria-labelledby="post-form-heading">
          <h2 id="post-form-heading">{editingId ? 'Edit blog' : 'New blog'}</h2>
          <form className="admin-form" onSubmit={submit} noValidate>
            <div className="admin-field">
              <label htmlFor="post-type">Blog type</label>
              <select
                id="post-type"
                value={form.type}
                onChange={(event) => set('type', event.target.value as PostInput['type'])}
                aria-invalid={Boolean(errors.type)}
                aria-describedby={describedBy('type')}
              >
                {POST_TYPES.map((type) => (
                  <option key={type} value={type}>{POST_TYPE_PLURAL[type]}</option>
                ))}
              </select>
              {errors.type ? <p id="type-error" className="admin-error">{errors.type}</p> : null}
            </div>

            <div className="admin-field">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                value={form.title}
                onChange={(event) => set('title', event.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={describedBy('title')}
                maxLength={160}
              />
              {errors.title ? <p id="title-error" className="admin-error">{errors.title}</p> : null}
            </div>

            <div className="admin-field admin-field-wide">
              <label htmlFor="post-summary">Summary</label>
              <textarea
                id="post-summary"
                rows={2}
                value={form.summary}
                onChange={(event) => set('summary', event.target.value)}
                aria-invalid={Boolean(errors.summary)}
                aria-describedby={describedBy('summary')}
              />
              {errors.summary ? <p id="summary-error" className="admin-error">{errors.summary}</p> : null}
            </div>

            <div className="admin-field admin-field-wide">
              <label htmlFor="post-body">Blog text</label>
              <textarea
                id="post-body"
                rows={8}
                value={form.body}
                onChange={(event) => set('body', event.target.value)}
                aria-invalid={Boolean(errors.body)}
                aria-describedby={describedBy('body') ?? 'body-hint'}
              />
              <p id="body-hint" className="admin-hint">Separate paragraphs with a blank line.</p>
              {errors.body ? <p id="body-error" className="admin-error">{errors.body}</p> : null}
            </div>

            <div className="admin-field">
              <label htmlFor="post-external">External link (optional)</label>
              <input
                id="post-external"
                type="url"
                inputMode="url"
                placeholder="https://example.org/article"
                value={form.externalUrl}
                onChange={(event) => set('externalUrl', event.target.value)}
                aria-invalid={Boolean(errors.externalUrl)}
                aria-describedby={describedBy('externalUrl') ?? 'external-hint'}
              />
              <p id="external-hint" className="admin-hint">For news and online resources. The card opens this link.</p>
              {errors.externalUrl ? <p id="externalUrl-error" className="admin-error">{errors.externalUrl}</p> : null}
            </div>

            <div className="admin-field">
              <label htmlFor="post-image">Image path (optional)</label>
              <input
                id="post-image"
                placeholder="/images/cover.jpg"
                value={form.image}
                onChange={(event) => set('image', event.target.value)}
                aria-invalid={Boolean(errors.image)}
                aria-describedby={describedBy('image')}
              />
              {errors.image ? <p id="image-error" className="admin-error">{errors.image}</p> : null}
            </div>

            <div className="admin-field">
              <label htmlFor="post-image-alt">Image description</label>
              <input
                id="post-image-alt"
                value={form.imageAlt}
                onChange={(event) => set('imageAlt', event.target.value)}
              />
            </div>

            <fieldset className="admin-field admin-field-wide admin-status-field">
              <legend>Status</legend>
              <label className="admin-radio"><input type="radio" name="post-status" value="published" checked={form.status === 'published'} onChange={() => set('status', 'published')} /> Published</label>
              <label className="admin-radio"><input type="radio" name="post-status" value="draft" checked={form.status === 'draft'} onChange={() => set('status', 'draft')} /> Draft (hidden)</label>
            </fieldset>

            {saveError ? <p role="alert" className="admin-error admin-error-summary">{saveError}</p> : null}

            <div className="admin-actions">
              <button type="submit" className="landing-cta">{editingId ? 'Save changes' : 'Create blog'}</button>
              {editingId ? <button type="button" className="admin-secondary" onClick={reset}>Cancel edit</button> : null}
            </div>
          </form>
        </section>

        <section className="admin-list-section" aria-labelledby="post-list-heading">
          <h2 id="post-list-heading">All blogs ({posts.length})</h2>
          {posts.length === 0 ? <p className="blog-empty">No blogs yet.</p> : null}
          <ul className="admin-list">
            {posts.map((post) => (
              <li key={post.id} className="admin-list-item">
                <div>
                  <strong>{post.title}</strong>
                  <span className="admin-meta">
                    {POST_TYPE_PLURAL[post.type]} · {post.status === 'published' ? 'Published' : 'Draft'}
                    {post.externalUrl ? ' · External link' : ''}
                  </span>
                </div>
                <div className="admin-actions">
                  {post.status === 'published' ? <a href={postHref(post)} {...(post.externalUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>View<span className="sr-only"> {post.title}</span></a> : null}
                  <button type="button" className="admin-secondary" onClick={() => edit(post)}>Edit<span className="sr-only"> {post.title}</span></button>
                  <button type="button" className="admin-danger" onClick={() => remove(post)}>Delete<span className="sr-only"> {post.title}</span></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SiteLayout>
  );
}
