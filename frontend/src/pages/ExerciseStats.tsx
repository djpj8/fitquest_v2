import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ExerciseStats() {
  const { data: stats = {} } = useQuery<Record<string, { date: string; maxWeight: number }[]>>({
    queryKey: ['exercise-stats'],
    queryFn: () => api.get('/workouts/exercise-stats'),
  });

  const [selected, setSelected] = useState<string>('');
  const exercises = Object.keys(stats).filter(k => stats[k].length >= 2);
  const currentEx = selected || exercises[0] || '';
  const chartData = (stats[currentEx] || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('it', { month: 'short', day: 'numeric' }),
    peso: d.maxWeight,
  }));

  const data = stats[currentEx] || [];
  const maxWeight = data.length ? Math.max(...data.map(d => d.maxWeight)) : 0;
  const firstWeight = data[data.length - 1]?.maxWeight || 0;
  const lastWeight = data[0]?.maxWeight || 0;
  const progress = firstWeight ? (((lastWeight - firstWeight) / firstWeight) * 100).toFixed(1) : null;

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem' }}>📊 Statistiche Esercizi</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Monitora la progressione per esercizio</p>
      </div>

      {exercises.length === 0 ? (
        <div className="rpg-card" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📊</div>
          <p style={{ marginBottom: '0.5rem' }}>Nessun dato disponibile</p>
          <p style={{ fontSize: '0.875rem' }}>Completa almeno 2 workout con lo stesso esercizio e con pesi per vedere i grafici.</p>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div className="rpg-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>SELEZIONA ESERCIZIO</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {exercises.map(ex => (
                <button key={ex} onClick={() => setSelected(ex)}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: `1px solid ${currentEx === ex ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, background: currentEx === ex ? 'hsl(var(--gold-tint-strong))' : 'hsl(var(--muted))', color: currentEx === ex ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {currentEx && (
            <>
              {/* Stats cards */}
              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                {[
                  { icon: '🏆', label: 'Massimo storico', value: `${maxWeight} kg`, color: 'hsl(var(--primary))' },
                  { icon: '📅', label: 'Sessioni registrate', value: data.length, color: 'hsl(var(--info))' },
                  { icon: '📈', label: 'Progressione', value: progress !== null ? `${Number(progress) > 0 ? '+' : ''}${progress}%` : '—', color: Number(progress) > 0 ? 'hsl(var(--xp))' : 'hsl(var(--danger))' },
                ].map(s => (
                  <div key={s.label} className="rpg-card" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="rpg-card" style={{ padding: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📈 Progressione peso — {currentEx}</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} unit=" kg" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} formatter={(v: any) => [`${v} kg`, 'Peso max']} />
                    <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>

                {/* History table */}
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {[...data].map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', background: i === 0 ? 'hsl(var(--gold-tint-strong))' : 'transparent', fontSize: '0.875rem' }}>
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(d.date).toLocaleDateString('it-IT')}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: i === 0 ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{d.maxWeight} kg {i === 0 && '🏆'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
