import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { CATEGORY_COLORS, CATEGORY_ICONS, isStatic } from '../lib/utils';

interface Exercise { id: number; name: string; category: string; type: string; xpReward: number; userId?: number | null; }
interface SetEntry { reps: number; seconds: number; weight: number; completed: boolean; }
interface WorkoutExercise { exercise: Exercise; sets: SetEntry[]; }

const CATEGORIES = ['all','chest','back','legs','shoulders','arms','core','cardio'];

export default function LogWorkout({ onNavigate, initialRoutineId }: { onNavigate: (p: string, id?: number) => void; initialRoutineId?: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: exercises = [] } = useQuery<Exercise[]>({ queryKey: ['exercises'], queryFn: () => api.get('/exercises') });
  const { data: favorites = [] } = useQuery<Exercise[]>({ queryKey: ['favorites'], queryFn: () => api.get('/exercises/favorites') });
  const { data: routines = [] } = useQuery<any[]>({ queryKey: ['routines'], queryFn: () => api.get('/routines') });

  const [workoutName, setWorkoutName] = useState(`Quest — ${new Date().toLocaleDateString('it', { month: 'short', day: 'numeric' })}`);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterType, setFilterType] = useState<'all'|'gym'|'calisthenics'|'favorites'|'custom'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEx, setNewEx] = useState({ name: '', category: 'chest', type: 'gym', muscleGroups: '' });
  const [routineLoaded, setRoutineLoaded] = useState(false);

  const favIds = new Set((favorites as Exercise[]).map(f => f.id));

  const loadRoutine = (routine: any) => {
    const exMap = new Map((exercises as Exercise[]).map(e => [e.id, e]));
    const loaded = (routine.exercises || []).map((re: any) => {
      const ex = exMap.get(re.exerciseId); if (!ex) return null;
      const s = isStatic(ex.name);
      return { exercise: ex, sets: Array.from({ length: re.sets || 3 }, () => ({ reps: s ? 1 : (re.reps || 10), seconds: s ? 30 : 0, weight: re.weight || 0, completed: false })) };
    }).filter(Boolean);
    setWorkoutExercises(loaded as WorkoutExercise[]);
    setWorkoutName(routine.name);
    setRoutineLoaded(true);
  };

  if (initialRoutineId && !routineLoaded && (exercises as Exercise[]).length > 0 && (routines as any[]).length > 0) {
    const r = (routines as any[]).find(r => r.id === initialRoutineId);
    if (r) loadRoutine(r);
  }

  const addExercise = (ex: Exercise) => {
    if ((workoutExercises as WorkoutExercise[]).find(w => w.exercise.id === ex.id)) return;
    const s = isStatic(ex.name);
    setWorkoutExercises(p => [...p, { exercise: ex, sets: [{ reps: s ? 1 : 10, seconds: s ? 30 : 0, weight: 0, completed: false }] }]);
  };

  const addSet = (i: number) => setWorkoutExercises(p => p.map((w, idx) => idx === i ? { ...w, sets: [...w.sets, { ...w.sets[w.sets.length-1], completed: false }] } : w));
  const updateSet = (ei: number, si: number, field: string, val: any) => setWorkoutExercises(p => p.map((w, i) => i === ei ? { ...w, sets: w.sets.map((s, j) => j === si ? { ...s, [field]: val } : s) } : w));
  const removeExercise = (i: number) => setWorkoutExercises(p => p.filter((_, idx) => idx !== i));

  const favMutation = useMutation({
    mutationFn: (id: number) => api.post(`/exercises/${id}/favorite`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const addExMutation = useMutation({
    mutationFn: () => api.post('/exercises', { name: newEx.name, category: newEx.category, type: newEx.type, muscleGroups: newEx.muscleGroups.split(',').map(s => s.trim()).filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exercises'] }); setShowAddForm(false); setNewEx({ name: '', category: 'chest', type: 'gym', muscleGroups: '' }); },
  });

  const deleteExMutation = useMutation({
    mutationFn: (id: number) => api.del(`/exercises/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });

  const logMutation = useMutation({
    mutationFn: () => api.post<any>('/workouts', { name: workoutName, exercises: (workoutExercises as WorkoutExercise[]).map(w => ({ exerciseId: w.exercise.id, name: w.exercise.name, sets: w.sets.filter(s => s.completed) })), durationMinutes: Math.max(1, Math.floor((Date.now() - startTime) / 60000)), notes }),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['me'] }); qc.invalidateQueries({ queryKey: ['workouts'] }); qc.invalidateQueries({ queryKey: ['stats'] }); setResult(data); },
  });

  const filtered = (exercises as Exercise[]).filter(e => {
    const ms = filterType === 'all' ? true : filterType === 'favorites' ? favIds.has(e.id) : filterType === 'custom' ? !!e.userId : e.type === filterType;
    return ms && (filterCat === 'all' || e.category === filterCat) && e.name.toLowerCase().includes(search.toLowerCase());
  });

  const inp: React.CSSProperties = { background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '0.5rem', outline: 'none', padding: '0.375rem 0.5rem', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' };

  if (result) return (
    <div style={{ padding: '1.5rem', maxWidth: '32rem', margin: '0 auto' }} className="fade-in">
      <div className="rpg-card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'hsl(43 85% 40%)', boxShadow: '0 0 40px hsl(43 85% 20% / 0.3)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
        <h2 className="gold-shimmer" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quest Completata!</h2>
        <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>Il tuo potere cresce...</p>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'hsl(160 60% 50%)', marginBottom: '1rem' }}>+{result.xpEarned} XP</div>
        {result.newAchievements?.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.5rem', background: 'hsl(43 85% 20% / 0.3)', border: '1px solid hsl(43 85% 40%)' }}>
            <div style={{ fontWeight: 'bold', color: 'hsl(var(--primary))', marginBottom: '0.5rem' }}>🎉 Achievement sbloccati!</div>
            {result.newAchievements.map((a: string) => <div key={a} style={{ fontSize: '0.875rem' }}>✨ {a.replace(/_/g, ' ')}</div>)}
          </div>
        )}
        <button onClick={() => onNavigate('dashboard')} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, hsl(43 85% 45%), hsl(43 85% 60%))', color: 'hsl(220 20% 6%)' }}>
          Torna alla Base
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem' }} className="fade-in">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', marginBottom: '0.25rem' }}>⚔️ Log Workout</h1>
      <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>Registra la tua quest e guadagna XP</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="rpg-card" style={{ padding: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>NOME QUEST</label>
            <input value={workoutName} onChange={e => setWorkoutName(e.target.value)} style={{ ...inp, textAlign: 'left', padding: '0.5rem 0.75rem' }} />
          </div>
          {(routines as any[]).length > 0 && (
            <div className="rpg-card" style={{ padding: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>📋 CARICA ROUTINE</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(routines as any[]).map((r: any) => (
                  <button key={r.id} onClick={() => loadRoutine(r)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: `1px solid ${workoutName === r.name ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, background: workoutName === r.name ? 'hsl(43 85% 20% / 0.4)' : 'hsl(var(--muted))', color: workoutName === r.name ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>📋 {r.name}</button>
                ))}
              </div>
            </div>
          )}
          {(workoutExercises as WorkoutExercise[]).length === 0 ? (
            <div className="rpg-card" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💪</div>
              <p>Aggiungi esercizi dalla lista →</p>
            </div>
          ) : (workoutExercises as WorkoutExercise[]).map((we, ei) => (
            <div key={we.exercise.id} className="rpg-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))' }}>{we.exercise.name}</span>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: `${CATEGORY_COLORS[we.exercise.category]}22`, color: CATEGORY_COLORS[we.exercise.category] }}>{CATEGORY_ICONS[we.exercise.category]} {we.exercise.category}</span>
                </div>
                <button onClick={() => removeExercise(ei)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2rem 1fr 1fr 2rem', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {['SET', isStatic(we.exercise.name) ? 'SEC' : 'REPS', 'KG', '✓'].map(h => <span key={h} style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{h}</span>)}
              </div>
              {we.sets.map((set, si) => (
                <div key={si} style={{ display: 'grid', gridTemplateColumns: '2rem 1fr 1fr 2rem', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ textAlign: 'center', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'hsl(var(--muted-foreground))' }}>{si+1}</span>
                  <input type="number" min="1" value={isStatic(we.exercise.name) ? set.seconds : set.reps} onChange={e => updateSet(ei, si, isStatic(we.exercise.name) ? 'seconds' : 'reps', +e.target.value)} style={inp} />
                  <input type="number" min="0" step="0.5" value={set.weight} onChange={e => updateSet(ei, si, 'weight', +e.target.value)} style={inp} />
                  <button onClick={() => updateSet(ei, si, 'completed', !set.completed)} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: `1px solid ${set.completed ? 'hsl(160 60% 40%)' : 'hsl(var(--border))'}`, background: set.completed ? 'hsl(160 60% 50%)' : 'hsl(var(--muted))', cursor: 'pointer', fontSize: '0.875rem' }}>{set.completed ? '✓' : ''}</button>
                </div>
              ))}
              <button onClick={() => addSet(ei)} style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}>+ Aggiungi serie</button>
            </div>
          ))}
          <div className="rpg-card" style={{ padding: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>NOTE</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Come è andata?" style={{ ...inp, textAlign: 'left', padding: '0.5rem 0.75rem', resize: 'none' }} />
          </div>
          <button onClick={() => logMutation.mutate()} disabled={(workoutExercises as WorkoutExercise[]).length === 0 || logMutation.isPending} style={{ padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', border: 'none', cursor: (workoutExercises as WorkoutExercise[]).length === 0 ? 'not-allowed' : 'pointer', background: (workoutExercises as WorkoutExercise[]).length === 0 ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(43 85% 45%), hsl(43 85% 60%))', color: (workoutExercises as WorkoutExercise[]).length === 0 ? 'hsl(var(--muted-foreground))' : 'hsl(220 20% 6%)' }}>
            {logMutation.isPending ? '⏳ Salvataggio...' : '🏆 Completa Quest'}
          </button>
        </div>
        <div className="rpg-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.125rem' }}>📚 Libreria Esercizi</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', cursor: 'pointer', border: 'none', background: showAddForm ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(43 85% 45%), hsl(43 85% 60%))', color: showAddForm ? 'hsl(var(--muted-foreground))' : 'hsl(220 20% 6%)' }}>
              {showAddForm ? '✕' : '➕ Custom'}
            </button>
          </div>
          {showAddForm && (
            <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.5rem', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input value={newEx.name} onChange={e => setNewEx(p => ({ ...p, name: e.target.value }))} placeholder="Nome esercizio" style={{ ...inp, textAlign: 'left', padding: '0.5rem 0.75rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select value={newEx.category} onChange={e => setNewEx(p => ({ ...p, category: e.target.value }))} style={{ ...inp, padding: '0.5rem 0.75rem' }}>
                  {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={newEx.type} onChange={e => setNewEx(p => ({ ...p, type: e.target.value }))} style={{ ...inp, padding: '0.5rem 0.75rem' }}>
                  <option value="gym">🏋️ Gym</option>
                  <option value="calisthenics">🤸 Calisthenics</option>
                </select>
              </div>
              <input value={newEx.muscleGroups} onChange={e => setNewEx(p => ({ ...p, muscleGroups: e.target.value }))} placeholder="Muscoli (es. petto, tricipiti)" style={{ ...inp, textAlign: 'left', padding: '0.5rem 0.75rem' }} />
              <button onClick={() => addExMutation.mutate()} disabled={!newEx.name || addExMutation.isPending} style={{ padding: '0.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: newEx.name ? 'pointer' : 'not-allowed', background: !newEx.name ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(43 85% 45%), hsl(43 85% 60%))', color: !newEx.name ? 'hsl(var(--muted-foreground))' : 'hsl(220 20% 6%)' }}>
                {addExMutation.isPending ? '⏳...' : '💾 Aggiungi'}
              </button>
            </div>
          )}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..." style={{ ...inp, textAlign: 'left', padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }} />
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {[{ id: 'all', label: 'Tutti' }, { id: 'gym', label: '🏋️ Gym' }, { id: 'calisthenics', label: '🤸 Cali' }, { id: 'favorites', label: '⭐ Preferiti' }, { id: 'custom', label: '✏️ Custom' }].map(f => (
              <button key={f.id} onClick={() => setFilterType(f.id as any)} style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', cursor: 'pointer', border: 'none', background: filterType === f.id ? 'hsl(var(--primary))' : 'hsl(var(--muted))', color: filterType === f.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))' }}>{f.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', cursor: 'pointer', border: `1px solid ${filterCat === cat ? 'hsl(43 85% 35%)' : 'transparent'}`, background: filterCat === cat ? 'hsl(43 85% 20%)' : 'transparent', color: filterCat === cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', textTransform: 'capitalize' }}>
                {cat === 'all' ? 'Tutti' : `${CATEGORY_ICONS[cat] || ''} ${cat}`}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '26rem', overflowY: 'auto' }}>
            {filtered.map(ex => {
              const sel = (workoutExercises as WorkoutExercise[]).find(w => w.exercise.id === ex.id);
              const isFav = favIds.has(ex.id);
              return (
                <div key={ex.id} onClick={() => !sel && addExercise(ex)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: sel ? 'default' : 'pointer', background: sel ? 'hsl(43 85% 20% / 0.4)' : 'hsl(var(--muted))', border: `2px solid ${sel ? 'hsl(43 85% 55%)' : 'transparent'}` }}>
                  <span style={{ flexShrink: 0 }}>{CATEGORY_ICONS[ex.category] || '💪'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                      {ex.type === 'calisthenics' && <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '999px', background: 'hsl(160 60% 20%)', color: 'hsl(160 60% 60%)', flexShrink: 0 }}>🤸</span>}
                      {ex.userId && <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '999px', background: 'hsl(280 60% 20%)', color: 'hsl(280 60% 70%)', flexShrink: 0 }}>✏️</span>}
                      {sel && <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '999px', background: 'hsl(43 85% 30%)', color: 'hsl(43 95% 65%)', flexShrink: 0 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>{ex.category} · +{ex.xpReward} XP</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => favMutation.mutate(ex.id)} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', cursor: 'pointer', border: 'none', background: isFav ? 'hsl(43 85% 20%)' : 'transparent', color: isFav ? 'hsl(43 95% 65%)' : 'hsl(var(--muted-foreground))' }}>{isFav ? '⭐' : '☆'}</button>
                    {ex.userId && <button onClick={() => deleteExMutation.mutate(ex.id)} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', cursor: 'pointer', border: 'none', background: 'transparent', color: 'hsl(var(--destructive))' }}>🗑️</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
