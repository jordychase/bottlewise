/* global React, Button, Chip, Card, IconBox, Field, TextInput, Checkbox, Toggle, RadioCard, TopBar, ScreenBody, DisclaimerFooter, FormulaCard, StockBadge, OriginBadge, Tin, CostBlock */
const { useState } = React;

const FORMULAS = [
  { id: 'bobbie', brand: 'Bobbie', name: 'Original Infant Formula', perOz: '1.78', stock: 'in_stock', stockAgo: '6h ago', origin: 'us', tinAccent: '#E6DFCF',
    tags: ['Organic', 'No palm oil'], reason: "Cow milk, organic, no palm oil. Matches the gentle-introduction profile you flagged. The most expensive of your three matches, but the only one without palm oil at this stage." },
  { id: 'byheart', brand: 'ByHeart', name: 'Whole Nutrition Infant Formula', perOz: '1.62', stock: 'in_stock', stockAgo: '2h ago', origin: 'us', tinAccent: '#F1E2BD',
    tags: ['No palm oil', 'A2 protein'], reason: "Same protein source as Bobbie with broader stock and a slightly cheaper per-ounce price. A2-only protein may be gentler on digestion." },
  { id: 'kendamil', brand: 'Kendamil', name: 'Organic First Infant Milk', perOz: '1.94', stock: 'low', origin: 'european', tinAccent: '#DCE6DF',
    tags: ['Organic', 'European'], reason: "Whole-milk fat blend (no palm oil). Imported — expect 2-week clearance and ~12% landed-cost overhead. Worth considering if availability holds." },
];

const AVOID = [
  { name: 'Similac Pro-Advance', reason: 'Family eczema history + intact cow-milk protein at this stage. Reconsider after 6 months.' },
];

// ============== Welcome ==============
const WelcomeScreen = ({ onPick }) => (
  <ScreenBody padding={24} style={{ justifyContent: 'space-between' }}>
    <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="../../assets/logo/bottlewise-mark.svg" alt="" style={{ width: 32, height: 32 }} />
        <span style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Bottlewise</span>
      </div>
      <h1 style={{
        fontFamily: "'Newsreader', serif", fontSize: 34, fontWeight: 600,
        lineHeight: 1.1, letterSpacing: '-0.02em', color: '#1F2A26', marginTop: 16,
      }}>
        Calmer formula decisions, grounded in what actually works.
      </h1>
      <p style={{ color: '#5A6862', fontSize: 15, lineHeight: 1.5, marginTop: 4 }}>
        Three picks for your baby — with the reasons, the cost, and what's actually in stock today.
      </p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A6862' }}>Where are you starting?</span>
      <RadioCard icon="sparkles" title="New to formula" hint="Help me pick a first formula based on my baby's profile." onClick={() => onPick('A')} />
      <RadioCard icon="alert-triangle" title="On formula, need help" hint="Stock issue, tolerance issue, or trying to find something gentler." onClick={() => onPick('B')} />
    </div>

    <div style={{ fontSize: 12, color: '#5A6862', textAlign: 'center', lineHeight: 1.45, paddingTop: 8 }}>
      Information & decision-support, not medical advice.
    </div>
  </ScreenBody>
);

// ============== Intake (Flow A, condensed) ==============
const IntakeScreen = ({ onContinue }) => {
  const [name, setName] = useState('Maya');
  const [allergies, setAllergies] = useState({ cmpa: true, soy: false, eczema: true });
  const [bf, setBf] = useState(false);
  const [imports, setImports] = useState(false);

  return (
    <ScreenBody padding={20}>
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A6B5D' }}>Step 1 of 3</span>
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em', marginTop: 6 }}>
          Tell us a little about your baby.
        </h2>
        <p style={{ color: '#5A6862', fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>
          Used only to match formulas. Never shared, never displayed publicly.
        </p>
      </div>

      <Field label="Baby's name" optional><TextInput value={name} onChange={setName} placeholder="e.g. Maya" /></Field>
      <Field label="Date of birth"><TextInput placeholder="MM / DD / YYYY" /></Field>
      <Field label="ZIP code" hint="Used to localize stock signals."><TextInput placeholder="37206" /></Field>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Family history</span>
        <Checkbox checked={allergies.cmpa} onToggle={(v) => setAllergies({...allergies, cmpa: v})}>Cow milk protein allergy</Checkbox>
        <Checkbox checked={allergies.soy} onToggle={(v) => setAllergies({...allergies, soy: v})}>Soy allergy</Checkbox>
        <Checkbox checked={allergies.eczema} onToggle={(v) => setAllergies({...allergies, eczema: v})}>Eczema</Checkbox>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Currently breastfeeding</div>
            <div style={{ fontSize: 13, color: '#5A6862' }}>We'll suggest gentle-introduction options.</div>
          </div>
          <Toggle on={bf} onChange={setBf} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Include European imports</div>
            <div style={{ fontSize: 13, color: '#5A6862' }}>Higher cost, longer clearance.</div>
          </div>
          <Toggle on={imports} onChange={setImports} />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <Button full onClick={onContinue} icon="arrow-right">See my picks</Button>
      </div>
    </ScreenBody>
  );
};

// ============== Recommendations ==============
const RecommendationsScreen = ({ onSelect, onChat }) => (
  <>
    <ScreenBody padding={20}>
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A6B5D' }}>Three picks for Maya</span>
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em', marginTop: 4 }}>
          Based on what you told us — gentle introduction, family eczema, no soy concern.
        </h2>
      </div>
      <FormulaCard formula={FORMULAS[0]} eyebrow="Best match" onClick={() => onSelect(FORMULAS[0])} />
      <FormulaCard formula={FORMULAS[1]} eyebrow="Close runner-up" onClick={() => onSelect(FORMULAS[1])} />
      <FormulaCard formula={FORMULAS[2]} eyebrow="Worth knowing" onClick={() => onSelect(FORMULAS[2])} />

      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C4A2D' }}>Avoid for now</span>
        {AVOID.map((a) => (
          <div key={a.name} style={{
            background: '#FBF7EE', border: '1px solid #E6DFCF', borderRadius: 12,
            padding: 14, display: 'flex', gap: 10,
          }}>
            <IconBox name="x-circle" size={18} style={{ color: '#A94B3B', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
              <div style={{ fontSize: 13, color: '#5A6862', lineHeight: 1.5, marginTop: 2 }}>{a.reason}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onChat} style={{
        background: 'transparent', border: '1px dashed #C9C0AB', borderRadius: 12,
        padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
        display: 'flex', gap: 10, alignItems: 'center', color: '#1F2A26',
      }}>
        <IconBox name="message-circle" size={18} style={{ color: '#4A6B5D' }} />
        <span style={{ fontSize: 14 }}>Ask a question about these picks</span>
      </button>
    </ScreenBody>
    <DisclaimerFooter />
  </>
);

// ============== Detail ==============
const DetailScreen = ({ formula, onOOS }) => (
  <>
    <ScreenBody padding={20}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Tin size={72} accent={formula.tinAccent} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#5A6862' }}>{formula.brand}</div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {formula.name}
          </h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            <StockBadge status={formula.stock} ago={formula.stockAgo} />
            <OriginBadge origin={formula.origin} />
          </div>
        </div>
      </div>

      <CostBlock perOz={formula.perOz} vsCurrent="−9% vs your current" landed={formula.origin === 'european' ? '+12%' : null} />

      <Card padding={18}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A6862', marginBottom: 8 }}>Why we picked this</div>
        <p style={{ color: '#1F2A26', fontSize: 15, lineHeight: 1.55, textWrap: 'pretty' }}>{formula.reason}</p>
      </Card>

      <Card padding={18}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A6862', marginBottom: 10 }}>At a glance</div>
        {[
          ['Protein source', 'Cow milk (intact)'],
          ['Carbohydrate', 'Lactose'],
          ['Fat blend', 'No palm oil'],
          ['DHA / ARA', '17 mg / 8 mg per 100 cal'],
          ['Country of origin', 'United States'],
          ['HTS code', '1901.10.30'],
        ].map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between', padding: '8px 0',
            borderBottom: '1px solid #E6DFCF', fontSize: 14,
          }}>
            <span style={{ color: '#5A6862' }}>{k}</span>
            <span style={{ color: '#1F2A26', fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </Card>

      <Card padding={18}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <IconBox name="package-2" size={18} style={{ color: '#4A6B5D' }} />
          <span style={{ fontWeight: 600 }}>Baby Brezza Pro Advanced</span>
        </div>
        <p style={{ fontSize: 13, color: '#5A6862', lineHeight: 1.5 }}>Setting #4 (most users). Use the included scoop. Reports of foam settling within 30s — normal.</p>
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button full onClick={onOOS} variant="secondary">Mark out of stock</Button>
        <Button full onClick={() => {}}>I'll try this</Button>
      </div>
    </ScreenBody>
    <DisclaimerFooter />
  </>
);

// ============== Out of stock cascade ==============
const OOSScreen = ({ onSelect }) => (
  <>
    <ScreenBody padding={20}>
      <Card padding={18} style={{ background: '#F2DECE', borderColor: '#E6C9A8' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <IconBox name="alert-triangle" size={18} style={{ color: '#8C4A2D', marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: '#5C2F18', fontSize: 15 }}>Bobbie is sold out near you.</div>
            <p style={{ fontSize: 14, color: '#7A4429', lineHeight: 1.5, marginTop: 4 }}>
              Both stores within 5 miles report empty shelves. Online stock is thin — last confirmed 6 hours ago.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A6B5D' }}>Closest available alternative</span>
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.01em', marginTop: 4 }}>
          Switch to ByHeart for now?
        </h2>
      </div>

      <FormulaCard formula={FORMULAS[1]} eyebrow="Closest match" onClick={() => onSelect(FORMULAS[1])} />

      <Card padding={18}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A6862', marginBottom: 8 }}>How close is this match?</div>
        {[
          ['Same protein source', 'Cow milk', 1.0],
          ['Similar fat blend', 'No palm oil', 1.0],
          ['Carbohydrate match', 'Lactose-only', 1.0],
          ['Specialty designations', '−A2 protein (different)', 0.6],
          ['Price tier', '−9% per oz', 1.0],
        ].map(([k, v, score]) => (
          <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid #E6DFCF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#1F2A26', fontWeight: 500 }}>{k}</span>
              <span style={{ color: '#5A6862' }}>{v}</span>
            </div>
            <div style={{ height: 4, background: '#E6DFCF', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${score * 100}%`, height: '100%', background: score > 0.8 ? '#5C8A6E' : '#C77E5C' }} />
            </div>
          </div>
        ))}
      </Card>

      <Button full variant="secondary">Show all alternatives (4)</Button>
    </ScreenBody>
    <DisclaimerFooter />
  </>
);

// ============== Chat ==============
const ChatScreen = ({ onTrigger }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "I can answer questions about your three picks, or help you compare any two formulas. What's on your mind?" },
  ]);
  const [draft, setDraft] = useState('');

  const send = () => {
    if (!draft.trim()) return;
    const triggerWords = ['blood', 'allergic', 'reaction', 'vomit', 'rash'];
    const isTrigger = triggerWords.some((w) => draft.toLowerCase().includes(w));
    setMessages([...messages, { role: 'user', text: draft }]);
    setDraft('');
    if (isTrigger) {
      setTimeout(() => onTrigger?.(draft), 400);
    } else {
      setTimeout(() => {
        setMessages((m) => [...m, { role: 'assistant', text: "Both Bobbie and ByHeart use whole milk fat blends without palm oil. ByHeart's A2-only protein is the main difference. Some parents report A2 is gentler on digestion, but evidence is anecdotal — your pediatrician can weigh in on whether that's worth prioritizing." }]);
      }, 600);
    }
  };

  return (
    <>
      <ScreenBody padding={16} style={{ gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.role === 'user' ? '#DCE6DF' : '#FBF7EE',
            border: m.role === 'user' ? 'none' : '1px solid #E6DFCF',
            color: m.role === 'user' ? '#1F2A26' : '#1F2A26',
            borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            padding: '10px 14px',
            fontSize: 14, lineHeight: 1.5, textWrap: 'pretty',
          }}>
            {m.role === 'assistant' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#4A6B5D' }}>
                <IconBox name="sparkles" size={12} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Bottlewise</span>
              </div>
            )}
            {m.text}
          </div>
        ))}
      </ScreenBody>
      <div style={{ padding: 12, borderTop: '1px solid #E6DFCF', background: 'rgba(246,241,232,0.92)', display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask about Bobbie vs ByHeart…"
          style={{
            flex: 1, background: '#FBF7EE', border: '1px solid #C9C0AB', borderRadius: 999,
            padding: '10px 14px', font: '400 14px/1.4 inherit', color: '#1F2A26', outline: 'none',
          }}
        />
        <button onClick={send} style={{
          width: 40, height: 40, borderRadius: 999, background: '#6B8E7F',
          border: 'none', color: '#FBF7EE', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconBox name="arrow-up" size={18} color="#FBF7EE" strokeWidth={2} />
        </button>
      </div>
    </>
  );
};

// ============== Safety interstitial ==============
const SafetyScreen = ({ trigger, onAck, onCallPed }) => {
  const phrase = trigger || 'severe symptoms';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 22px', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: '#ECCFC8', color: '#A94B3B',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconBox name="octagon-alert" size={22} />
      </div>
      <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em' }}>
        A few words before we go further.
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.55, color: '#1F2A26' }}>
        You mentioned <span style={{ background: '#ECCFC8', padding: '1px 4px', borderRadius: 3 }}>{phrase}</span>. That's something a pediatrician should look at today, not something Bottlewise can help you reason about.
      </p>
      <p style={{ fontSize: 14, color: '#5A6862', lineHeight: 1.5 }}>When you're ready, we'll be here.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <Button full variant="danger" onClick={onCallPed}>Call your pediatrician</Button>
        <Button full variant="secondary" onClick={onAck}>I've already spoken to them</Button>
      </div>
    </div>
  );
};

Object.assign(window, { WelcomeScreen, IntakeScreen, RecommendationsScreen, DetailScreen, OOSScreen, ChatScreen, SafetyScreen, FORMULAS });
