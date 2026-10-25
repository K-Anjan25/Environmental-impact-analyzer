import type { ReactNode } from 'react';

/*
 * Side visuals for the feature rows. Each one is a product-style composition: a framed card with a
 * hard offset shadow, and a summary card that overlaps its lower edge. The content uses the
 * process vocabulary of the product (stages, selected rows, boundary states). It shows no measured
 * values, so nothing here reads as a result. The compositions are decorative, so they are
 * aria-hidden, and the section text next to them carries the meaning.
 */

function Pill({ tone, children }: { tone: 'solid' | 'outline'; children: ReactNode }) {
  return <span className={`sv-pill sv-pill-${tone}`}>{children}</span>;
}

/** Feature 1: a queue of process rows, each tagged with its boundary status, and a subtotal summary. */
export function ProcessQueueVisual() {
  return (
    <div className="sv" aria-hidden="true">
      <div className="sv-card">
        <div className="sv-head">
          <span>Process queue</span>
          <span className="sv-muted">Declared rows</span>
        </div>
        <ul className="sv-rows">
          <li className="sv-row">
            <Pill tone="solid">Selected</Pill>
            <div>
              <strong>Dyeing stage</strong>
              <span>Process row · in subtotal</span>
            </div>
          </li>
          <li className="sv-row">
            <Pill tone="outline">Not declared</Pill>
            <div>
              <strong>Distribution to customer</strong>
              <span>A4 · climate change only</span>
            </div>
          </li>
          <li className="sv-row">
            <Pill tone="outline">GHG layer</Pill>
            <div>
              <strong>Waste treatment</strong>
              <span>C3 · climate change only</span>
            </div>
          </li>
        </ul>
      </div>
      <div className="sv-float">
        <span className="sv-float-label">Subtotal</span>
        <div className="sv-bar">
          <span />
        </div>
        <span className="sv-float-note">Selected rows only</span>
      </div>
    </div>
  );
}

/** Feature 2: rows that are ticked into a selection, and a stacked summary of the ticked rows. */
export function SelectionVisual() {
  const rows = [
    { name: 'Raw material', on: true },
    { name: 'Assembly', on: true },
    { name: 'Finishing', on: false },
    { name: 'Packaging', on: true },
  ];
  return (
    <div className="sv" aria-hidden="true">
      <div className="sv-card">
        <div className="sv-head">
          <span>Row selection</span>
          <span className="sv-muted">Tick to subtotal</span>
        </div>
        <ul className="sv-rows">
          {rows.map((row) => (
            <li key={row.name} className="sv-row sv-row-check">
              <span className={`sv-check${row.on ? ' is-on' : ''}`} />
              <div>
                <strong>{row.name}</strong>
                <span>{row.on ? 'Included in subtotal' : 'Not selected'}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="sv-float">
        <span className="sv-float-label">Selected total</span>
        <div className="sv-stack">
          <span style={{ flex: 3 }} />
          <span style={{ flex: 2 }} />
          <span style={{ flex: 1 }} />
        </div>
        <span className="sv-float-note">Only the rows you ticked</span>
      </div>
    </div>
  );
}

/** Feature 3: the browser boundary, with the input states that stay inside it. */
export function BoundaryVisual() {
  return (
    <div className="sv" aria-hidden="true">
      <div className="sv-card">
        <div className="sv-head">
          <span>Browser boundary</span>
          <span className="sv-muted">This tab</span>
        </div>
        <ul className="sv-rows">
          <li className="sv-row">
            <Pill tone="solid">Local</Pill>
            <div>
              <strong>Product inputs</strong>
              <span>Quantities and materials</span>
            </div>
          </li>
          <li className="sv-row">
            <Pill tone="outline">In tab</Pill>
            <div>
              <strong>Estimate view</strong>
              <span>Rows and indicators</span>
            </div>
          </li>
          <li className="sv-row">
            <Pill tone="outline">On request</Pill>
            <div>
              <strong>Export file</strong>
              <span>Created when you export</span>
            </div>
          </li>
        </ul>
      </div>
      <div className="sv-float">
        <span className="sv-float-label">Your inputs</span>
        <div className="sv-stack sv-stack-single">
          <span />
        </div>
        <span className="sv-float-note">Stay in your browser</span>
      </div>
    </div>
  );
}
