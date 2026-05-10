/* global React, ReactDOM, AppShell, TopBar, TabBar, WelcomeScreen, IntakeScreen, RecommendationsScreen, DetailScreen, OOSScreen, ChatScreen, SafetyScreen */
const { useState, useEffect } = React;

const App = () => {
  const [route, setRoute] = useState('welcome');
  const [selected, setSelected] = useState(null);
  const [trigger, setTrigger] = useState(null);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const titles = {
    welcome: 'Bottlewise', intake: 'About your baby', recs: 'Your three picks',
    detail: 'Formula', oos: 'Out of stock', chat: 'Chat', safety: 'Important',
  };
  const showBack = !['welcome', 'safety'].includes(route);

  let body;
  if (route === 'welcome') body = <WelcomeScreen onPick={() => setRoute('intake')} />;
  else if (route === 'intake') body = <IntakeScreen onContinue={() => setRoute('recs')} />;
  else if (route === 'recs') body = <RecommendationsScreen onSelect={(f) => { setSelected(f); setRoute('detail'); }} onChat={() => setRoute('chat')} />;
  else if (route === 'detail') body = <DetailScreen formula={selected} onOOS={() => setRoute('oos')} />;
  else if (route === 'oos') body = <OOSScreen onSelect={(f) => { setSelected(f); setRoute('detail'); }} />;
  else if (route === 'chat') body = <ChatScreen onTrigger={(t) => { setTrigger(t); setRoute('safety'); }} />;
  else if (route === 'safety') body = <SafetyScreen trigger={trigger} onAck={() => setRoute('recs')} onCallPed={() => alert('In production: open phone dialer / show pediatrician contact card.')} />;

  return (
    <AppShell>
      {route !== 'welcome' && route !== 'safety' && (
        <TopBar
          title={titles[route]}
          back={showBack ? () => setRoute(route === 'detail' ? 'recs' : route === 'oos' ? 'detail' : route === 'intake' ? 'welcome' : 'recs') : null}
        />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{body}</div>
      {(route === 'recs' || route === 'detail' || route === 'oos') && (
        <TabBar active="picks" onChange={(t) => {
          if (t === 'home' || t === 'picks') setRoute('recs');
          else if (t === 'chat') setRoute('chat');
        }} />
      )}
    </AppShell>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
