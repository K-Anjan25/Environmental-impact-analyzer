import { useState } from 'react';
import { Drawer, IconButton, List, ListItemButton, ListItemText } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { guides } from './guides';

const links = [
  { label: 'Overview', href: '#top' },
  { label: 'Process library', href: '#process-library' },
  { label: 'Results', href: '#results-heading' },
  ...guides.map((guide) => ({ label: guide.title, href: `#/guides/${guide.slug}` })),
];

export default function SiteMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton className="site-menu-button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <MenuRoundedIcon />
      </IconButton>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { className: 'site-menu-drawer' } }}>
        <div className="site-menu-head">
          <strong>Menu</strong>
          <IconButton aria-label="Close menu" onClick={() => setOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </div>
        <nav aria-label="Site menu">
          <List>
            {links.map((link) => (
              <ListItemButton key={link.href} component="a" href={link.href} onClick={() => setOpen(false)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
        </nav>
      </Drawer>
    </>
  );
}
