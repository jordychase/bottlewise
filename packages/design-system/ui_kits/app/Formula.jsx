/* global React, IconBox, Chip */
const { useState } = React;

// ---------- StockBadge ----------
const StockBadge = ({ status, ago }) => {
  if (status === 'in_stock') return <Chip tone="success" dot>In stock{ago ? ` — ${ago}` : ''}</Chip>;
  if (status === 'low')      return <Chip tone="warn" dot>Low stock locally</Chip>;
  if (status === 'oos')      return <Chip tone="danger" dot>Out of stock</Chip>;
  return <Chip tone="neutral" dot>Stock unknown</Chip>;
};

// ---------- OriginBadge ----------
const OriginBadge = ({ origin }) => {
  if (origin === 'european') return <Chip tone="honey">European import</Chip>;
  return <Chip tone="success">FDA-registered</Chip>;
};

// ---------- Tin (placeholder for product photo) ----------
const Tin = ({ size = 88, label = '[ tin ]', accent = '#E6DFCF' }) => (
  <div style={{
    width: size, height: size,
    borderRadius: 12, background: accent,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#5A6862', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
    flexShrink: 0,
  }}>{label}</div>
);

// ---------- CostBlock ----------
const CostBlock = ({ perOz, vsCurrent, landed }) => (
  <div style={{
    background: '#F6F1E8',
    border: '1px solid #E6DFCF',
    borderRadius: 12, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 13, color: '#5A6862', fontWeight: 600 }}>Per reconstituted ounce</span>
      <span style={{
        fontFamily: "'Newsreader', serif",
        fontSize: 22, fontWeight: 600, fontFeatureSettings: '"tnum"',
        color: '#1F2A26', letterSpacing: '-0.01em',
      }}>${perOz}</span>
    </div>
    {vsCurrent && (
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: '#5A6862' }}>vs your current formula</span>
        <span style={{ color: vsCurrent.startsWith('-') ? '#3D6651' : '#8C4A2D', fontWeight: 600 }}>{vsCurrent}</span>
      </div>
    )}
    {landed && (
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: '#5A6862' }}>Landed cost (incl. duty)</span>
        <span style={{ color: '#8C4A2D', fontWeight: 600 }}>{landed}</span>
      </div>
    )}
  </div>
);

// ---------- FormulaCard ----------
const FormulaCard = ({ formula, eyebrow, onClick, compact }) => (
  <div onClick={onClick} style={{
    background: '#FBF7EE',
    border: '1px solid #E6DFCF',
    borderRadius: 16, padding: 18,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'border-color 120ms cubic-bezier(0.2,0.8,0.2,1)',
  }}>
    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 14 }}>
      <Tin size={72} accent={formula.tinAccent || '#E6DFCF'} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow && (
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#4A6B5D', marginBottom: 2,
              }}>{eyebrow}</div>
            )}
            <div style={{
              fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600,
              lineHeight: 1.2, color: '#1F2A26', letterSpacing: '-0.005em',
            }}>{formula.name}</div>
            <div style={{ fontSize: 13, color: '#5A6862', marginTop: 2 }}>{formula.brand}</div>
          </div>
          <div style={{
            fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 600,
            fontFeatureSettings: '"tnum"', color: '#1F2A26',
            letterSpacing: '-0.01em', whiteSpace: 'nowrap',
          }}>
            ${formula.perOz}<span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11, fontWeight: 500, color: '#5A6862', letterSpacing: 0 }}>/oz</span>
          </div>
        </div>
      </div>
    </div>
    {!compact && formula.reason && (
      <div style={{ color: '#5A6862', fontSize: 14, lineHeight: 1.5, marginTop: 12, textWrap: 'pretty' }}>
        {formula.reason}
      </div>
    )}
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
      <StockBadge status={formula.stock} ago={formula.stockAgo} />
      {formula.origin === 'european' && <OriginBadge origin="european" />}
      {formula.tags?.map((t) => <Chip key={t} tone="neutral">{t}</Chip>)}
    </div>
  </div>
);

Object.assign(window, { StockBadge, OriginBadge, Tin, CostBlock, FormulaCard });
