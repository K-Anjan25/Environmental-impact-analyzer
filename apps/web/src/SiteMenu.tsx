import { useEffect, useId, useRef, useState } from 'react';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

/*
 * Menu button and dropdown panel. The button sits at the start of the header, beside the logo.
 * The panel drops down under the header. It closes on Escape, on an outside click, and after a link is used.
 * Legal pages are linked from the footer, not from this menu.
 */

/** One item per destination. Blogs is a single item; its types have their own routes. */
export const MENU_ITEMS: { href: string; label: string }[] = [
  { href: '#/', label: 'Home' },
  { href: '#/calculator', label: 'Calculator' },
  { href: '#/pricing', label: 'Plans' },
  { href: '#/blogs', label: 'Blogs' },
  { href: '#/contact', label: 'Contact' },
];

export default function SiteMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  return (
    <div className="site-menu" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="site-menu-button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
      </button>
      <div id={panelId} className="site-menu-panel" hidden={!open}>
        <nav aria-label="Site menu">
          <ul className="site-menu-list">
            {MENU_ITEMS.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
