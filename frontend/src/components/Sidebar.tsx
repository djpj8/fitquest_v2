import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { classIcon, classInfo } from '../lib/classes';

const NAV = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard', short: 'Home' },
  { id: 'log-workout', icon: '⚔️', label: 'Registra allenamento', short: 'Allena' },
  { id: 'routines', icon: '📋', label: 'Routine', short: 'Routine' },
  { id: 'programs', icon: '📖', label: 'Programmi', short: 'Piani' },
  { id: 'history', icon: '📜', label: 'Cronologia', short: 'Storico' },
  { id: 'achievements', icon: '🏆', label: 'Achievement', short: 'Trofei' },
  { id: 'leaderboard', icon: '👑', label: 'Classifica', short: 'Classifica' },
  { id: 'body-tracker', icon: '📏', label: 'Body Tracker', short: 'Corpo' },
  { id: 'exercise-stats', icon: '📊', label: 'Statistiche', short: 'Stats' },
  { id: 'profile', icon: '⚙️', label: 'Profilo', short: 'Profilo' },
];

// Le 4 voci più usate stanno nella barra inferiore del telefono, il resto in "Altro"
const BOTTOM_IDS = ['dashboard', 'log-workout', 'leaderboard', 'achievements'];

interface Props { currentPage: string; onNavigate: (page: string) => void; }

export default function Sidebar({ currentPage, onNavigate }: Props) {
  const { user, logout, setTheme } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  // Blocca lo scroll della pagina quando il menu è aperto e chiudi con Esc
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [moreOpen]);

  if (!user) return null;

  const xpPercent = Math.min(100, (user.currentXp / user.xpToNextLevel) * 100);
  const isDark = user.theme !== 'light';
  const cls = classInfo(user.avatarClass);

  const handleNav = (id: string) => { onNavigate(id); setMoreOpen(false); };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fitquest_theme', next);
    setTheme(next);
  };

  const navButton = (item: typeof NAV[number]) => {
    const active = currentPage === item.id;
    return (
      <button key={item.id} onClick={() => handleNav(item.id)} aria-current={active ? 'page' : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
          border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          background: active ? 'hsl(var(--gold-tint))' : 'transparent',
          color: active ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-foreground))',
          borderLeft: active ? '3px solid hsl(var(--primary))' : '3px solid transparent',
          fontFamily: active ? 'var(--font-serif)' : 'inherit',
          fontWeight: active ? 700 : 400,
          fontSize: '0.95rem',
        }}>
        <span style={{ width: '1.5rem', textAlign: 'center' }}>{item.icon}</span><span>{item.label}</span>
      </button>
    );
  };

  const profileBlock = (
    <div style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="level-badge" style={{ width: '3rem', height: '3rem', fontSize: '1.4rem', flexShrink: 0 }}>
          {classIcon(user.avatarClass)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.displayName || user.username}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
            Livello {user.level} · {cls.name}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'hsl(var(--xp))', fontWeight: 600 }}>XP</span>
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>{user.currentXp} / {user.xpToNextLevel}</span>
      </div>
      <div className="xp-bar" style={{ height: '0.5rem' }}>
        <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
      </div>
    </div>
  );

  const logoutButton = (
    <button onClick={() => logout()}
      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', width: '100%', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem' }}>
      <span style={{ width: '1.5rem', textAlign: 'center' }}>🚪</span><span>Esci</span>
    </button>
  );

  const themeButton = (
    <button onClick={toggleTheme} title="Cambia tema" aria-label="Cambia tema"
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem', color: 'hsl(var(--sidebar-foreground))' }}>
      {isDark ? '☀️' : '🌙'}
    </button>
  );

  const bottomItems = NAV.filter(n => BOTTOM_IDS.includes(n.id));
  const moreActive = !BOTTOM_IDS.includes(currentPage);

  return (
    <>
      {/* ── Barra superiore (telefono) ── */}
      <header className="mobile-topbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'hsl(var(--sidebar))', borderBottom: '1px solid hsl(var(--sidebar-border))', padding: '0.5rem 1rem', paddingTop: 'calc(0.5rem + env(safe-area-inset-top))', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/favicon.svg" alt="" width={26} height={26} />
          <span className="gold-shimmer" style={{ fontFamily: 'var(--font-serif)', fontWeight: 'bold', fontSize: '1.1rem' }}>FitQuest</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ minWidth: '6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
              <span style={{ color: 'hsl(var(--xp))', fontWeight: 700 }}>Lv.{user.level}</span>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{Math.floor(xpPercent)}%</span>
            </div>
            <div className="xp-bar" style={{ height: '0.35rem' }}><div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} /></div>
          </div>
          {themeButton}
        </div>
      </header>

      {/* ── Barra laterale (PC) ── */}
      <aside className="desktop-sidebar" style={{ width: '17rem', flexShrink: 0, flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--sidebar-border))' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid hsl(var(--sidebar-border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/favicon.svg" alt="" width={34} height={34} />
            <span className="gold-shimmer" style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>FitQuest</span>
          </div>
          {themeButton}
        </div>
        {profileBlock}
        <nav aria-label="Navigazione principale" style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', overflowY: 'auto' }}>
          {NAV.map(navButton)}
        </nav>
        <div style={{ padding: '0.75rem', borderTop: '1px solid hsl(var(--sidebar-border))' }}>{logoutButton}</div>
      </aside>

      {/* ── Barra inferiore (telefono) ── */}
      <nav className="mobile-bottombar" aria-label="Navigazione rapida"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'hsl(var(--sidebar))', borderTop: '1px solid hsl(var(--sidebar-border))', paddingBottom: 'env(safe-area-inset-bottom)', justifyContent: 'space-around' }}>
        {bottomItems.map(item => {
          const active = currentPage === item.id;
          return (
            <button key={item.id} onClick={() => handleNav(item.id)} aria-current={active ? 'page' : undefined}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '0.5rem 0.25rem', minHeight: '3.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', fontWeight: active ? 700 : 400 }}>
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '0.7rem' }}>{item.short}</span>
            </button>
          );
        })}
        <button onClick={() => setMoreOpen(true)} aria-haspopup="dialog"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '0.5rem 0.25rem', minHeight: '3.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: moreActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', fontWeight: moreActive ? 700 : 400 }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>☰</span>
          <span style={{ fontSize: '0.7rem' }}>Altro</span>
        </button>
      </nav>

      {/* ── Menu "Altro" (telefono) ── */}
      {moreOpen && (
        <div role="dialog" aria-modal="true" aria-label="Menu" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={() => setMoreOpen(false)} style={{ position: 'absolute', inset: 0, background: 'hsl(var(--overlay))' }} />
          <div style={{ position: 'relative', zIndex: 101, width: '100%', maxHeight: '85dvh', overflowY: 'auto', background: 'hsl(var(--sidebar))', borderTop: '1px solid hsl(var(--sidebar-border))', borderRadius: '1rem 1rem 0 0', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem 1rem 0' }}>
              <span style={{ width: '2.5rem', height: '4px', borderRadius: '2px', background: 'hsl(var(--border))' }} />
            </div>
            {profileBlock}
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {NAV.map(navButton)}
              {logoutButton}
            </div>
            <button onClick={() => setMoreOpen(false)} style={{ display: 'block', width: 'calc(100% - 1.5rem)', margin: '0 0.75rem 0.75rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', cursor: 'pointer', fontSize: '0.95rem' }}>Chiudi</button>
          </div>
        </div>
      )}
    </>
  );
}
