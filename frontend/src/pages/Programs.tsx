import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

const DIFF_COLORS: Record<string,string> = { beginner:'hsl(var(--xp))', intermediate:'hsl(var(--primary))', advanced:'hsl(var(--danger))' };
const DIFF_ICONS: Record<string,string> = { beginner:'🌱', intermediate:'⚔️', advanced:'🔥' };

export default function Programs() {
  const qc = useQueryClient();
  const { data: programs = [] } = useQuery<any[]>({ queryKey: ['programs'], queryFn: () => api.get('/programs') });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [form, setForm] = useState({ name:'', description:'', daysPerWeek:3, difficulty:'beginner', isPublic:false });
  const inp: React.CSSProperties = { background:'hsl(var(--input))', border:'1px solid hsl(var(--border))', color:'hsl(var(--foreground))', borderRadius:'0.5rem', outline:'none', padding:'0.5rem 0.75rem', fontSize:'0.875rem', boxSizing:'border-box', width:'100%' };

  const saveMutation = useMutation({
    mutationFn: () => editingId ? api.put(`/programs/${editingId}`, form) : api.post('/programs', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs'] }); setCreating(false); setEditingId(null); setForm({ name:'', description:'', daysPerWeek:3, difficulty:'beginner', isPublic:false }); },
  });
  const deleteMutation = useMutation({ mutationFn: (id:number) => api.del(`/programs/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }) });
  const startEdit = (p:any) => { setForm({ name:p.name, description:p.description||'', daysPerWeek:p.daysPerWeek||3, difficulty:p.difficulty, isPublic:!!p.isPublic }); setEditingId(p.id); setCreating(true); };

  if (creating) return (
    <div className="page fade-in">
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
        <button onClick={() => { setCreating(false); setEditingId(null); }} style={{ background:'none', border:'none', cursor:'pointer', color:'hsl(var(--muted-foreground))' }}>← Indietro</button>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.5rem' }}>{editingId ? '✏️ Modifica' : '📖 Nuovo Programma'}</h1>
      </div>
      <div className="rpg-card" style={{ padding:'1.5rem', maxWidth:'40rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div><label style={{ display:'block', fontSize:'0.7rem', marginBottom:'0.25rem', fontFamily:'var(--font-serif)', color:'hsl(var(--primary))', letterSpacing:'0.1em' }}>NOME</label><input value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} placeholder="es. 12 Settimane Forza" style={inp} /></div>
        <div><label style={{ display:'block', fontSize:'0.7rem', marginBottom:'0.25rem', fontFamily:'var(--font-serif)', color:'hsl(var(--primary))', letterSpacing:'0.1em' }}>DESCRIZIONE</label><textarea value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))} rows={3} style={{ ...inp, resize:'none' }} /></div>
        <div><label style={{ display:'block', fontSize:'0.7rem', marginBottom:'0.5rem', fontFamily:'var(--font-serif)', color:'hsl(var(--primary))', letterSpacing:'0.1em' }}>GIORNI/SETTIMANA</label>
          <div style={{ display:'flex', gap:'0.5rem' }}>{[2,3,4,5,6].map(d => <button key={d} type="button" onClick={() => setForm(p => ({...p, daysPerWeek:d}))} style={{ width:'2.5rem', height:'2.5rem', borderRadius:'0.5rem', fontWeight:'bold', cursor:'pointer', border:`1px solid ${form.daysPerWeek===d?'hsl(var(--primary))':'hsl(var(--border))'}`, background:form.daysPerWeek===d?'hsl(var(--primary))':'hsl(var(--muted))', color:form.daysPerWeek===d?'hsl(var(--primary-foreground))':'hsl(var(--muted-foreground))' }}>{d}</button>)}</div>
        </div>
        <div><label style={{ display:'block', fontSize:'0.7rem', marginBottom:'0.5rem', fontFamily:'var(--font-serif)', color:'hsl(var(--primary))', letterSpacing:'0.1em' }}>DIFFICOLTÀ</label>
          <div style={{ display:'flex', gap:'0.5rem' }}>{['beginner','intermediate','advanced'].map(d => <button key={d} type="button" onClick={() => setForm(p => ({...p, difficulty:d}))} style={{ flex:1, padding:'0.5rem', borderRadius:'0.5rem', cursor:'pointer', border:`1px solid ${form.difficulty===d?DIFF_COLORS[d]:'hsl(var(--border))'}`, background:form.difficulty===d?`${DIFF_COLORS[d]}22`:'hsl(var(--muted))', color:form.difficulty===d?DIFF_COLORS[d]:'hsl(var(--muted-foreground))', textTransform:'capitalize' }}>{DIFF_ICONS[d]} {d}</button>)}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', borderRadius:'0.5rem', background:'hsl(var(--muted))' }}>
          <button type="button" onClick={() => setForm(p => ({...p, isPublic:!p.isPublic}))} style={{ width:'2.5rem', height:'1.5rem', borderRadius:'999px', cursor:'pointer', border:'none', position:'relative', background:form.isPublic?'hsl(var(--primary))':'hsl(var(--border))' }}>
            <span style={{ position:'absolute', top:'2px', width:'1.25rem', height:'1.25rem', borderRadius:'50%', background:'white', transition:'left 0.2s', left:form.isPublic?'calc(100% - 22px)':'2px' }} />
          </button>
          <span style={{ fontSize:'0.875rem', color:'hsl(var(--muted-foreground))' }}>{form.isPublic ? '🌍 Visibile a tutti' : '🔒 Solo tu'}</span>
        </div>
        <button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending} style={{ padding:'0.75rem', borderRadius:'0.5rem', fontWeight:'bold', fontFamily:'var(--font-serif)', border:'none', cursor:form.name?'pointer':'not-allowed', background:!form.name?'hsl(var(--muted))':'var(--btn-gradient)', color:!form.name?'hsl(var(--muted-foreground))':'hsl(var(--btn-text))' }}>
          {saveMutation.isPending ? '⏳ Salvataggio...' : '💾 Salva Programma'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="page fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div><h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem' }}>📖 Programmi</h1><p style={{ color:'hsl(var(--muted-foreground))' }}>Campagne di allenamento</p></div>
        <button onClick={() => setCreating(true)} style={{ padding:'0.5rem 1rem', borderRadius:'0.5rem', fontWeight:'bold', fontFamily:'var(--font-serif)', border:'none', cursor:'pointer', background:'var(--btn-gradient)', color:'hsl(var(--btn-text))' }}>📖 Nuovo</button>
      </div>
      {(programs as any[]).length === 0 ? (
        <div className="rpg-card" style={{ padding:'3rem', textAlign:'center', color:'hsl(var(--muted-foreground))' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>📖</div>
          <p style={{ marginBottom:'1rem' }}>Nessun programma</p>
          <button onClick={() => setCreating(true)} style={{ color:'hsl(var(--primary))', background:'none', border:'none', cursor:'pointer', fontWeight:'bold' }}>Crea il tuo primo programma →</button>
        </div>
      ) : (
        <div className="grid-cards">
          {(programs as any[]).map(p => (
            <div key={p.id} className="rpg-card" style={{ padding:'1rem' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <h3 style={{ fontFamily:'var(--font-serif)', color:'hsl(var(--primary))', fontSize:'1rem' }}>📖 {p.name}</h3>
                <span style={{ fontSize:'0.7rem', padding:'0.1rem 0.4rem', borderRadius:'999px', background:`${DIFF_COLORS[p.difficulty]}22`, color:DIFF_COLORS[p.difficulty], border:`1px solid ${DIFF_COLORS[p.difficulty]}44`, flexShrink:0 }}>{DIFF_ICONS[p.difficulty]} {p.difficulty}</span>
              </div>
              {p.description && <p style={{ fontSize:'0.875rem', color:'hsl(var(--muted-foreground))', marginBottom:'0.75rem' }}>{p.description}</p>}
              <div style={{ fontSize:'0.75rem', color:'hsl(var(--muted-foreground))', fontFamily:'var(--font-mono)', marginBottom:'0.75rem' }}>📅 {p.daysPerWeek}x/sett · {formatDate(p.created_at)}</div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={() => startEdit(p)} style={{ flex:1, padding:'0.375rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer', border:'1px solid hsl(var(--border))', background:'none', color:'hsl(var(--foreground))' }}>✏️ Modifica</button>
                <button onClick={() => deleteMutation.mutate(p.id)} style={{ padding:'0.375rem 0.625rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer', border:'1px solid hsl(var(--destructive-border))', background:'none', color:'hsl(var(--destructive))' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
