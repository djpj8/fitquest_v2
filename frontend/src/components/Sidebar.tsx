import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'log-workout', icon: '⚔️', label: 'Log Workout' },
  { id: 'routines', icon: '📋', label: 'Routine' },
  { id: 'programs', icon: '📖', label: 'Programmi' },
  { id: 'history', icon: '📜', label: 'Cronologia' },
  { id: 'achievements', icon: '🏆', label: 'Achievement' },
  { id: 'body-tracker', icon: '📏', label: 'Body Tracker' },
  { id: 'exercise-stats', icon: '📊', label: 'Statistiche' },
  { id: 'profile', icon: '⚙️', label: 'Profilo' },
];

const CLASS_ICONS: Record<string, string> = { warrior: '⚔️', mage: '🔮', ranger: '🏹' };

interface Props { currentPage: string; onNavigate: (page: string) => void; }

export default function Sidebar({ currentPage, onNavigate }: Props) {
  const { user, logout, setTheme } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const xpPercent = Math.min(100, (user.currentXp / user.xpToNextLevel) * 100);
  const isDark = user.theme !== 'light';

  const handleNav = (id: string) => { onNavigate(id); setMobileOpen(false); };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fitquest_theme', next);
    setTheme(next);
  };

  const Content = () => (
    <>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid hsl(var(--sidebar-border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚔️</span>
          <span className="gold-shimmer" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>FitQuest</span>
        </div>
        <button onClick={toggleTheme} title="Cambia tema"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'hsl(var(--sidebar-foreground))' }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="level-badge" style={{ width: '3rem', height: '3rem', fontSize: '1.25rem', flexShrink: 0 }}>
            {CLASS_ICONS[user.avatarClass] || '⚔️'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName || user.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textTransform: 'capitalize' }}>
              Level {user.level} {user.avatarClass}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'hsl(160 60% 50%)' }}>XP</span>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>{user.currentXp} / {user.xpToNextLevel}</span>
        </div>
        <div className="xp-bar" style={{ height: '0.5rem' }}>
          <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => handleNav(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
              border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              background: currentPage === item.id ? 'hsl(43 85% 55% / 0.15)' : 'transparent',
              color: currentPage === item.id ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-foreground))',
              borderLeft: currentPage === item.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              fontFamily: currentPage === item.id ? 'var(--font-serif)' : 'inherit',
              fontSize: '0.875rem',
            }}>
            <span>{item.icon}</span><span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '1px solid hsl(var(--sidebar-border))' }}>
        <button onClick={() => logout()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', width: '100%', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}
          onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--destructive))'}
          onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}>
          <span>🚪</span><span>Esci</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'hsl(var(--sidebar))', borderBottom: '1px solid hsl(var(--sidebar-border))', padding: '0.75rem 1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚔️</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>FitQuest</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>{isDark ? '☀️' : '🌙'}</button>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'hsl(160 60% 50%)' }}>Lv.{user.level}</span>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: 'hsl(var(--foreground))', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{ width: '16rem', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--sidebar-border))' }}>
        <Content />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'hsl(220 20% 6% / 0.8)' }} />
          <div style={{ position: 'relative', zIndex: 101, width: '16rem', height: '100%', display: 'flex', flexDirection: 'column', background: 'hsl(var(--sidebar))', borderRight: '1px solid hsl(var(--sidebar-border))' }}>
            <Content />
          </div>
        </div>
      )}
    </>
  );
}
