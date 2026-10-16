import { useState } from 'react';
import { Drawer, IconButton } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { guides } from './guides';

type SiteMenuProps = {
  sourceVersion?: string;
  totalRecords?: number | string;
};

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
            <a className="brand" href="#top" onClick={close} aria-label="EcoImpact Lab home">
              <img className="brand-mark-image" src="/brand/mark.svg" alt="" />
              <span className="brand-name">EcoImpact Lab</span>
            </a>
            <IconButton className="menu-close" aria-label="Close menu" onClick={close}>
              <CloseRoundedIcon />
            </IconButton>
          </div>
          <div className="sidebar-kicker">APPAREL & FOOTWEAR</div>
          <nav className="sidebar-navigation" aria-label="Site menu">
            <a href="#top" onClick={close}><DashboardOutlinedIcon fontSize="small" /><span>Overview</span></a>
            <a href="#product-inputs" onClick={close}><Inventory2OutlinedIcon fontSize="small" /><span>Product inputs</span></a>
            <a href="#process-library" onClick={close}><FactoryOutlinedIcon fontSize="small" /><span>Process library</span></a>
            <a href="#results-heading" onClick={close}><QueryStatsOutlinedIcon fontSize="small" /><span>Results</span></a>
            {guides.map((guide) => (
              <a key={guide.slug} href={`#/guides/${guide.slug}`} onClick={close}>
                <ArticleOutlinedIcon fontSize="small" /><span>{guide.title}</span>
              </a>
            ))}
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
