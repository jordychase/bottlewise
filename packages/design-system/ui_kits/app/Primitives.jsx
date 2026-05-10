/* global React */
const { useState } = React;

// ---------- Button ----------
const Button = ({ variant = 'primary', size = 'md', icon, children, onClick, disabled, full, style }) => {
  const base = {
    fontFamily: 'inherit',
    fontSize: size === 'sm' ? 13 : 15,
    fontWeight: 600,
    border: '1px solid transparent',
    borderRadius: size === 'sm' ? 8 : 12,
    padding: size === 'sm' ? '8px 12px' : '12px 18px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    lineHeight: 1,
    letterSpacing: '-0.005em',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 120ms cubic-bezier(0.2,0.8,0.2,1)',
    width: full ? '100%' : 'auto',
    ...style,
  };
  const variants = {
    primary: { background: disabled ? '#C5D2C9' : '#6B8E7F', color: '#FBF7EE' },
    secondary: { background: 'transparent', color: '#1F2A26', borderColor: '#C9C0AB' },
    tertiary: { background: 'transparent', color: '#4A6B5D', borderColor: 'transparent' },
    danger: { background: '#A94B3B', color: '#FBF7EE' },
    sage_soft: { background: '#DCE6DF', color: '#3D6651', borderColor: 'transparent' },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === 'primary') e.currentTarget.style.background = '#4A6B5D';
        if (variant === 'secondary') e.currentTarget.style.background = '#E6DFCF';
        if (variant === 'tertiary') e.currentTarget.style.background = '#DCE6DF';
        if (variant === 'sage_soft') e.currentTarget.style.background = '#C8D8CC';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variants[variant].background;
      }}
    >
      {icon && <i data-lucide={icon} style={{ width: 16, height: 16, strokeWidth: 1.75 }} />}
      {children}
    </button>
  );
};

// ---------- Chip ----------
const Chip = ({ tone = 'neutral', dot, children }) => {
  const tones = {
    neutral: { bg: '#FBF7EE', fg: '#5A6862', border: '#E6DFCF' },
    success: { bg: '#DCE6DF', fg: '#3D6651', border: 'transparent' },
    warn:    { bg: '#F2DECE', fg: '#8C4A2D', border: 'transparent' },
    danger:  { bg: '#ECCFC8', fg: '#7E2E22', border: 'transparent' },
    info:    { bg: '#D6DEE3', fg: '#3F5663', border: 'transparent' },
    honey:   { bg: '#F1E2BD', fg: '#7C5B1A', border: 'transparent' },
    sage:    { bg: '#DCE6DF', fg: '#3D6651', border: 'transparent' },
  };
  const dotColors = { success: '#5C8A6E', warn: '#C77E5C', danger: '#A94B3B', info: '#5C7A8A', neutral: '#94A09B' };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: t.bg, color: t.fg,
      border: `1px solid ${t.border}`,
      borderRadius: 999, padding: '5px 11px',
      fontSize: 12, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: dotColors[tone] || '#94A09B' }} />}
      {children}
    </span>
  );
};

// ---------- Card ----------
const Card = ({ children, padding = 20, style, onClick }) => (
  <div onClick={onClick} style={{
    background: '#FBF7EE',
    border: '1px solid #E6DFCF',
    borderRadius: 16,
    padding,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }}>{children}</div>
);

// ---------- IconBox (lucide wrapper) ----------
const IconBox = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.5, style }) => (
  <i data-lucide={name} style={{ width: size, height: size, color, strokeWidth, ...style }} />
);

// ---------- Field (label + input) ----------
const Field = ({ label, optional, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label style={{ fontSize: 13, fontWeight: 600, color: '#1F2A26' }}>
        {label} {optional && <span style={{ color: '#94A09B', fontWeight: 400 }}>(optional)</span>}
      </label>
    )}
    {children}
    {hint && <span style={{ fontSize: 12, color: '#5A6862' }}>{hint}</span>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text' }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        background: '#FBF7EE',
        border: `1px solid ${focused ? '#6B8E7F' : '#C9C0AB'}`,
        outline: focused ? '2px solid #6B8E7F' : 'none',
        outlineOffset: 2,
        borderRadius: 12,
        padding: '12px 14px',
        font: '400 15px/1.4 inherit',
        color: '#1F2A26',
      }}
    />
  );
};

// ---------- Checkbox ----------
const Checkbox = ({ checked, onToggle, children }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 15 }}>
    <span onClick={() => onToggle?.(!checked)} style={{
      width: 20, height: 20, borderRadius: 6,
      border: `1.5px solid ${checked ? '#6B8E7F' : '#C9C0AB'}`,
      background: checked ? '#6B8E7F' : '#FBF7EE',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBF7EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      )}
    </span>
    <span>{children}</span>
  </label>
);

// ---------- Toggle ----------
const Toggle = ({ on, onChange }) => (
  <span
    onClick={() => onChange?.(!on)}
    style={{
      width: 40, height: 24, borderRadius: 999,
      background: on ? '#6B8E7F' : '#C9C0AB',
      position: 'relative', cursor: 'pointer',
      transition: 'background 120ms cubic-bezier(0.2,0.8,0.2,1)',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 2, left: on ? 18 : 2,
      width: 20, height: 20, borderRadius: 999, background: '#FBF7EE',
      transition: 'left 120ms cubic-bezier(0.2,0.8,0.2,1)',
    }} />
  </span>
);

// ---------- Radio Card ----------
const RadioCard = ({ selected, onClick, title, hint, icon }) => (
  <div onClick={onClick} style={{
    background: '#FBF7EE',
    border: `1px solid ${selected ? '#6B8E7F' : '#E6DFCF'}`,
    boxShadow: selected ? 'inset 0 0 0 1px #6B8E7F' : 'none',
    borderRadius: 16, padding: 18,
    display: 'flex', gap: 12, alignItems: 'flex-start',
    cursor: 'pointer',
    transition: 'border-color 120ms, box-shadow 120ms',
  }}>
    {icon && (
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: selected ? '#DCE6DF' : '#E6DFCF',
        color: selected ? '#4A6B5D' : '#5A6862',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <IconBox name={icon} size={20} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2A26', lineHeight: 1.3 }}>{title}</div>
      {hint && <div style={{ fontSize: 14, color: '#5A6862', marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
    </div>
    <span style={{
      width: 20, height: 20, borderRadius: 999,
      border: `1.5px solid ${selected ? '#6B8E7F' : '#C9C0AB'}`,
      background: selected ? '#6B8E7F' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, marginTop: 2,
    }}>
      {selected && <span style={{ width: 8, height: 8, borderRadius: 999, background: '#FBF7EE' }} />}
    </span>
  </div>
);

Object.assign(window, { Button, Chip, Card, IconBox, Field, TextInput, Checkbox, Toggle, RadioCard });
