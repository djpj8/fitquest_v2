import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/utils';

interface Exercise { id: number; name: string; category: string; type: string; }
interface RoutineEx { exerciseId: number; sets: number; reps: number; weight: number; }

export default function Routines({ onNavigate }: { onNavigate?: (p: string, id?: number) => void }) {
  const qc = useQueryClient();
  const { data: routines = [] } = useQuery<any[]>({ queryKey: ['routines'], queryFn: () => api.get('/routines') });
  const { data: exercises = [] } = useQuery<Exercise[]>({ queryKey: ['exercises'], queryFn: () => api.get('/exercises') });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [form, setForm] = useState({ name: '', exercises: [] as RoutineEx[] });
  const [search, setSearch] = useState('');
  const exMap = new Map((exercises as Exercise[]).map(e => [e.id, e]));
  const filtered = (exercises as Exercise[]).filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const inp: React.CSSProperties = { background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '0.5rem', outline: 'none', padding: '0.5rem 0.75rem', fontSize: '0.875rem', boxSizing: 'border-box', width: '100%' };

  const saveMutation = useMutation({
    mutationFn: () => editingId ? api.put(`/routines/${editingId}`, form) : api.post('/routines', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routines'] }); setCreating(false); setEditingId(null); setForm({ name: '', exercises: [] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/routines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });

  const addEx = (ex: Exercise) => { if (form.exercises.find(e => e.exerciseId === ex.id)) return; setForm(p => ({ ...p, exercises: [...p.exercises, { exerciseId: ex.id, sets: 3, reps: 10, weight: 0 }] })); };
  const updateEx = (i: number, f: string, v: any) => setForm(p => ({ ...p, exercises: p.exercises.map((e, idx) => idx === i ? { ...e, [f]: v } : e) }));
  const startEdit = (r: any) => { setForm({ name: r.name, exercises: r.exercises || [] }); setEditingId(r.id); setCreating(true); };

  if (creating) return (
    <div className="page fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => { setCreating(false); setEditingId(null); setForm({ name: '', exercises: [] }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>← Indietro</button>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>{editingId ? '✏️ Modifica Routine' : '⚒️ Nuova Routine'}</h1>
      </div>
      <div className="grid-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="rpg-card" style={{ padding: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>NOME</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="es. Push Day" style={inp} />
          </div>
          {form.exercises.map((re, i) => { const ex = exMap.get(re.exerciseId); if (!ex) return null; return (
            <div key={i} className="rpg-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))' }}>{CATEGORY_ICONS[ex.category]} {ex.name}</span>
                <button onClick={() => setForm(p => ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {[['sets','Serie'],['reps','Reps'],['weight','KG']].map(([f,l]) => (
                  <div key={f}><div style={{ fontSize: '0.7rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>{l}</div>
                    <input type="number" min="0" value={(re as any)[f]} onChange={e => updateEx(i, f, +e.target.value)} style={{ ...inp, textAlign: 'center' }} />
                  </div>
                ))}
              </div>
            </div>
          ); })}
          <button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending} style={{ padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', border: 'none', cursor: form.name ? 'pointer' : 'not-allowed', background: !form.name ? 'hsl(var(--muted))' : 'var(--btn-gradient)', color: !form.name ? 'hsl(var(--muted-foreground))' : 'hsl(var(--btn-text))' }}>
            {saveMutation.isPending ? '⏳ Salvataggio...' : '💾 Salva Routine'}
          </button>
        </div>
        <div className="rpg-card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Libreria Esercizi</h2>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..." style={{ ...inp, marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '30rem', overflowY: 'auto' }}>
            {filtered.map(ex => { const sel = !!form.exercises.find(e => e.exerciseId === ex.id); return (
              <div key={ex.id} onClick={() => !sel && addEx(ex)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', cursor: sel ? 'default' : 'pointer', background: sel ? 'hsl(var(--gold-tint-strong))' : 'hsl(var(--muted))', border: `2px solid ${sel ? 'hsl(var(--primary))' : 'transparent'}` }}>
                <span>{CATEGORY_ICONS[ex.category] || '💪'}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: '0.875rem' }}>{ex.name}</div><div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>{ex.category}</div></div>
                {sel && <span style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))' }}>✓</span>}
              </div>
            ); })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div><h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem' }}>📋 Routine</h1><p style={{ color: 'hsl(var(--muted-foreground))' }}>I tuoi piani di battaglia</p></div>
        <button onClick={() => setCreating(true)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', border: 'none', cursor: 'pointer', background: 'var(--btn-gradient)', color: 'hsl(var(--btn-text))' }}>⚒️ Nuova</button>
      </div>
      {(routines as any[]).length === 0 ? (
        <div className="rpg-card" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
          <p style={{ marginBottom: '1rem' }}>Nessuna routine</p>
          <button onClick={() => setCreating(true)} style={{ color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Crea la tua prima routine →</button>
        </div>
      ) : (
        <div className="grid-cards">
          {(routines as any[]).map(r => (
            <div key={r.id} className="rpg-card" style={{ padding: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', marginBottom: '0.5rem' }}>📋 {r.name}</h3>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.75rem' }}>{(r.exercises || []).length} esercizi</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                {(r.exercises || []).slice(0, 3).map((re: any, i: number) => { const ex = exMap.get(re.exerciseId); return ex ? <span key={i} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: `${CATEGORY_COLORS[ex.category]}22`, color: CATEGORY_COLORS[ex.category] }}>{ex.name}</span> : null; })}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => onNavigate && onNavigate('log-workout', r.id)} style={{ flex: 1, padding: '0.375rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', border: 'none', cursor: 'pointer', background: 'var(--btn-gradient)', color: 'hsl(var(--btn-text))' }}>⚔️ Inizia</button>
                <button onClick={() => startEdit(r)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid hsl(var(--border))', background: 'none', color: 'hsl(var(--foreground))' }}>✏️</button>
                <button onClick={() => deleteMutation.mutate(r.id)} style={{ padding: '0.375rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid hsl(var(--destructive-border))', background: 'none', color: 'hsl(var(--destructive))' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
