import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate, calcBMI, bmiCategory } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface Measurement { id: number; weightKg: number; heightCm: number | null; notes: string | null; measuredAt: string; }

export default function BodyTracker() {
  const qc = useQueryClient();
  const { data: measurements = [] } = useQuery<Measurement[]>({ queryKey: ['measurements'], queryFn: () => api.get('/measurements') });

  const [form, setForm] = useState({ weightKg: '', heightCm: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const lastHeight = measurements.find(m => m.heightCm)?.heightCm;

  const addMutation = useMutation({
    mutationFn: () => api.post('/measurements', { weightKg: +form.weightKg, heightCm: form.heightCm ? +form.heightCm : lastHeight || null, notes: form.notes || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['measurements'] }); qc.invalidateQueries({ queryKey: ['me'] }); setForm({ weightKg: '', heightCm: '', notes: '' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/measurements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements'] }),
  });

  const chartData = [...measurements].reverse().slice(-20).map(m => ({
    date: new Date(m.measuredAt).toLocaleDateString('it', { month: 'short', day: 'numeric' }),
    peso: m.weightKg,
    bmi: m.heightCm ? calcBMI(m.weightKg, m.heightCm) : null,
  }));

  const latest = measurements[0];
  const latestBMI = latest?.heightCm ? calcBMI(latest.weightKg, latest.heightCm) : null;
  const bmiInfo = latestBMI ? bmiCategory(latestBMI) : null;

  const weightChange = measurements.length >= 2 ? measurements[0].weightKg - measurements[measurements.length - 1].weightKg : null;

  const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', outline: 'none', fontSize: '0.875rem', boxSizing: 'border-box' };

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem' }}>📏 Body Tracker</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Monitora il tuo progresso fisico</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="rpg-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚖️</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))' }}>{latest?.weightKg ?? '—'} <span style={{ fontSize: '1rem' }}>kg</span></div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Peso attuale</div>
        </div>
        <div className="rpg-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧮</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: bmiInfo?.color || 'hsl(var(--primary))' }}>{latestBMI ?? '—'}</div>
          <div style={{ fontSize: '0.75rem', color: bmiInfo?.color || 'hsl(var(--muted-foreground))' }}>{bmiInfo?.label || 'BMI — inserisci altezza'}</div>
        </div>
        <div className="rpg-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{weightChange === null ? '📈' : weightChange > 0 ? '📈' : '📉'}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: weightChange === null ? 'hsl(var(--muted-foreground))' : weightChange > 0 ? 'hsl(var(--danger))' : 'hsl(var(--xp))' }}>
            {weightChange === null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Variazione totale</div>
        </div>
      </div>

      <div className="grid-split-rev" style={{ marginBottom: '1.5rem' }}>
        {/* Form */}
        <div className="rpg-card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>➕ Nuova Misurazione</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>PESO (KG) *</label>
              <input type="number" step="0.1" min="20" max="300" value={form.weightKg} onChange={e => setForm(p => ({ ...p, weightKg: e.target.value }))} placeholder="es. 75.5" style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>ALTEZZA (CM)</label>
              <input type="number" step="0.5" min="100" max="250" value={form.heightCm} onChange={e => setForm(p => ({ ...p, heightCm: e.target.value }))} placeholder={lastHeight ? `${lastHeight} (ultimo)` : 'es. 175'} style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>NOTE</label>
              <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Come ti senti oggi?" style={inp} />
            </div>
            <button onClick={() => addMutation.mutate()} disabled={!form.weightKg || addMutation.isPending}
              style={{ padding: '0.625rem', borderRadius: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', border: 'none', cursor: form.weightKg ? 'pointer' : 'not-allowed', background: !form.weightKg ? 'hsl(var(--muted))' : 'var(--btn-gradient)', color: !form.weightKg ? 'hsl(var(--muted-foreground))' : 'hsl(var(--btn-text))' }}>
              {addMutation.isPending ? '⏳ Salvataggio...' : '💾 Salva Misurazione'}
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="rpg-card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📈 Andamento Peso</h2>
          {chartData.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</p>
              <p>Aggiungi almeno 2 misurazioni per vedere il grafico</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} formatter={(v: any) => [`${v} kg`, 'Peso']} />
                <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* History */}
      <div className="rpg-card" style={{ padding: '1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📋 Storico Misurazioni</h2>
        {measurements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>
            <p>Nessuna misurazione ancora</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {measurements.map(m => {
              const bmi = m.heightCm ? calcBMI(m.weightKg, m.heightCm) : null;
              const bmiInfo = bmi ? bmiCategory(bmi) : null;
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ fontSize: '1.5rem' }}>⚖️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{m.weightKg} kg {bmi && <span style={{ fontSize: '0.875rem', color: bmiInfo?.color }}>· BMI {bmi} ({bmiInfo?.label})</span>}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {formatDate(m.measuredAt)}{m.heightCm ? ` · ${m.heightCm} cm` : ''}{m.notes ? ` · "${m.notes}"` : ''}
                    </div>
                  </div>
                  <button onClick={() => deleteMutation.mutate(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--destructive))', fontSize: '1rem' }}>🗑️</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
