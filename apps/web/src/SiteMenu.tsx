import { useState } from 'react';
import { Drawer, IconButton } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';

type SiteMenuProps = {
  sourceVersion?: string;
  totalRecords?: number | string;
};

/** One item per destination. Blogs is a single item; its types have their own routes. */
const MENU_ITEMS = [
  { href: '#/', label: 'Home', icon: <HomeOutlinedIcon fontSize="small" /> },
  { href: '#/calculator', label: 'Calculator', icon: <CalculateOutlinedIcon fontSize="small" /> },
  { href: '#/blogs', label: 'Blogs', icon: <ArticleOutlinedIcon fontSize="small" /> },
];

export default function SiteMenu({ sourceVersion = '1.1.0', totalRecords = '302' }: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <IconButton className="site-menu-button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <MenuRoundedIcon />
      </IconButton>
      <Drawer anchor="right" open={open} onClose={close} slotProps={{ paper: { className: 'site-menu-drawer' } }}>
        <div className="menu-panel">
          <div className="menu-panel-top">
            <a className="brand" href="#/" onClick={close} aria-label="EcoImpact Lab home">
              <img className="brand-mark-image" src="/brand/mark.svg" alt="" />
              <span className="brand-name">EcoImpact Lab</span>
            </a>
            <IconButton className="menu-close" aria-label="Close menu" onClick={close}>
              <CloseRoundedIcon />
            </IconButton>
          </div>
          <div className="sidebar-kicker">APPAREL & FOOTWEAR</div>
          <nav className="sidebar-navigation" aria-label="Site menu">
            {MENU_ITEMS.map((item) => (
              <a key={item.href} href={item.href} onClick={close}>
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
            <a href="/legal/terms.html" onClick={close}><GavelOutlinedIcon fontSize="small" /><span>Terms of use</span></a>
            <a href="/legal/privacy.html" onClick={close}><PrivacyTipOutlinedIcon fontSize="small" /><span>Privacy policy</span></a>
          </nav>
          <div className="sidebar-source-card menu-source-card">
            <span className="sidebar-source-label">PINNED SOURCE</span>
            <strong>Carbonfact</strong>
            <span>Version {sourceVersion} · CC BY-SA 4.0</span>
            <span className="sidebar-source-count"><i aria-hidden="true" /> {totalRecords} published factors</span>
          </div>
        </div>
      </Drawer>
    </>
  );
}
