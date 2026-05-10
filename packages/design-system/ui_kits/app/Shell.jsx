/* global React */
const { useState } = React;

// ---------- TopBar ----------
const TopBar = ({ title, back, right }) => (
  <div style={{
    height: 56, padding: '0 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #E6DFCF',
    background: 'rgba(246,241,232,0.92)',
    backdropFilter: 'blur(16px)',
    position: 'sticky', top: 0, zIndex: 10,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 40 }}>
      {back && (
        <button onClick={back} style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1F2A26',
        }}>
          <IconBox name="arrow-left" size={20} />
        </button>
      )}
    </div>
    <div style={{
      fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 600,
      color: '#1F2A26', letterSpacing: '-0.01em',
    }}>{title}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 40, justifyContent: 'flex-end' }}>{right}</div>
  </div>
);

// ---------- TabBar ----------
const TabBar = ({ active, onChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'picks', label: 'Picks', icon: 'sparkles' },
    { id: 'chat', label: 'Chat', icon: 'message-circle' },
    { id: 'baby', label: 'Maya', icon: 'baby' },
  ];
  return (
    <div style={{
      borderTop: '1px solid #E6DFCF',
      background: 'rgba(246,241,232,0.92)',
      backdropFilter: 'blur(16px)',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      paddingBottom: 'env(safe-area-inset-bottom, 6px)',
    }}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange?.(t.id)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '10px 8px 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: isActive ? '#4A6B5D' : '#94A09B',
          }}>
            <IconBox name={t.icon} size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ---------- DisclaimerFooter — required on every recommendation surface ----------
const DisclaimerFooter = ({ floating }) => (
  <div style={{
    padding: '14px 20px',
    borderTop: floating ? 'none' : '1px solid #E6DFCF',
    color: '#5A6862', fontSize: 12, lineHeight: 1.45,
    display: 'flex', gap: 8, alignItems: 'flex-start',
    background: floating ? 'transparent' : 'rgba(246,241,232,0.92)',
  }}>
    <IconBox name="info" size={14} style={{ marginTop: 2, flexShrink: 0, color: '#5A6862' }} />
    <span>
      Bottlewise is information & decision-support, not medical advice. Talk to your pediatrician before changing formulas, especially with allergy or feeding concerns.
    </span>
  </div>
);

// ---------- AppShell ----------
const AppShell = ({ children, scrim }) => (
  <div style={{
    minHeight: '100vh',
    background: 'linear-gradient(#EDE5D2, #EDE5D2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, position: 'relative',
  }}>
    <div style={{
      width: '100%', maxWidth: 420, minHeight: 760,
      background: '#F6F1E8',
      borderRadius: 32,
      overflow: 'hidden',
      border: '1px solid #E6DFCF',
      boxShadow: '0 24px 48px -16px rgba(31,42,38,0.18)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {children}
    </div>
    {scrim}
  </div>
);

// ---------- ScreenBody — scrollable content region ----------
const ScreenBody = ({ children, padding = 20, style }) => (
  <div style={{
    flex: 1,
    overflowY: 'auto',
    padding,
    display: 'flex', flexDirection: 'column', gap: 16,
    ...style,
  }}>
    {children}
  </div>
);

Object.assign(window, { TopBar, TabBar, DisclaimerFooter, AppShell, ScreenBody });
