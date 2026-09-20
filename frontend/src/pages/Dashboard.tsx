import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { formatDate, formatDuration } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user } = useAuth();
  const { data: stats } = useQuery<any>({ queryKey: ['stats'], queryFn: () => api.get('/workouts/stats') });
  const { data: logs = [] } = useQuery<any[]>({ queryKey: ['workouts'], queryFn: () => api.get('/workouts') });
  const xpPercent = user ? Math.min(100, (user.currentXp / user.xpToNextLevel) * 100) : 0;
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('it', { weekday: 'short' });
    const dayLogs = (stats?.recentLogs || []).filter((l: any) => new Date(l.completedAt).toDateString() === d.toDateString());
    return { day: label, xp: dayLogs.reduce((s: number, l: any) => s + l.xpEarned, 0) };
  });
  const statCards = [
    { icon: '⚔️', label: 'Quest Totali', value: stats?.totalWorkouts ?? 0, color: 'hsl(43 85% 55%)' },
    { icon: '⚡', label: 'XP Totali', value: (stats?.totalXpEarned ?? 0).toLocaleString(), color: 'hsl(160 60% 50%)' },
    { icon: '⏱️', label: 'Tempo Allenato', value: formatDuration(stats?.totalDuration), color: 'hsl(280 60% 60%)' },
    { icon: '🔥', label: 'Questa Settimana', value: `${stats?.recentWorkouts ?? 0} quest`, color: 'hsl(0 70% 55%)' },
  ];
  return (
    <div style={{ padding: '1.5rem' }} className="fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem' }}>Bentornato, <span className="gold-shimmer">{user?.displayName || user?.username}</span></h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>La tua avventura continua...</p>
      </div>
      <div className="rpg-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'hsl(43 85% 35%)', boxShadow: '0 0 40px hsl(43 85% 20% / 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="level-badge" style={{ width: '5rem', height: '5rem', fontSize: '1.875rem', flexShrink: 0 }}>{user?.level}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))' }}>Level {user?.level}</span>
              <span style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic', textTransform: 'capitalize' }}>{user?.avatarClass}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'hsl(160 60% 50%)' }}>{user?.currentXp?.toLocaleString()} / {user?.xpToNextLevel?.toLocaleString()} XP</span>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{Math.floor(xpPercent)}% → Lv.{(user?.level ?? 1) + 1}</span>
            </div>
            <div className="xp-bar" style={{ height: '1rem' }}><div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} /></div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map(card => (
          <div key={card.label} className="rpg-card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{card.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: card.color, marginBottom: '0.25rem' }}>{card.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{card.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="rpg-card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>⚡ XP Questa Settimana</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs><linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160 60% 50%)" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(160 60% 50%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} formatter={(v: any) => [`${v} XP`, 'XP']} />
              <Area type="monotone" dataKey="xp" stroke="hsl(160 60% 50%)" strokeWidth={2} fill="url(#xpGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rpg-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem' }}>📜 Recenti</h2>
            <button onClick={() => onNavigate('history')} style={{ fontSize: '0.875rem', color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer' }}>Vedi tutto →</button>
          </div>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'hsl(var(--muted-foreground))' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚔️</p>
              <button onClick={() => onNavigate('log-workout')} style={{ color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem' }}>Inizia la tua prima quest →</button>
            </div>
          ) : logs.slice(0, 4).map((log: any) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '0.375rem', background: 'hsl(var(--muted))' }}>
              <span>⚔️</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>{formatDate(log.completedAt)}</div>
              </div>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'hsl(160 60% 50%)', flexShrink: 0 }}>+{log.xpEarned}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[{ icon: '⚔️', label: 'Log Workout', page: 'log-workout', desc: 'Registra un allenamento' }, { icon: '📏', label: 'Body Tracker', page: 'body-tracker', desc: 'Aggiungi misurazione' }, { icon: '📊', label: 'Statistiche', page: 'exercise-stats', desc: 'Vedi progressione' }].map(b => (
          <button key={b.page} onClick={() => onNavigate(b.page)}
            style={{ padding: '1rem', borderRadius: '0.5625rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{b.icon}</div>
            <div style={{ fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', fontWeight: 'bold', marginBottom: '0.25rem' }}>{b.label}</div>
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>{b.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
