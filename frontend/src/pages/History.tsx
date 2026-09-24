import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate, formatDuration } from '../lib/utils';

export default function History() {
  const { data: logs = [] } = useQuery<any[]>({ queryKey: ['workouts'], queryFn: () => api.get('/workouts') });
  const [expanded, setExpanded] = useState<number|null>(null);
  const totalXp = (logs as any[]).reduce((s,l) => s+l.xpEarned,0);
  const totalTime = (logs as any[]).reduce((s,l) => s+(l.durationMinutes||0),0);
  return (
    <div className="page fade-in">
      <div style={{ marginBottom:'1.5rem' }}><h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem' }}>📜 Cronologia</h1><p style={{ color:'hsl(var(--muted-foreground))' }}>Le tue battaglie</p></div>
      <div className="grid-3" style={{ marginBottom:'1.5rem' }}>
        {[{label:'Quest Totali',value:(logs as any[]).length,icon:'⚔️',color:'hsl(var(--primary))'},{label:'XP Guadagnati',value:totalXp.toLocaleString(),icon:'⚡',color:'hsl(var(--xp))'},{label:'Tempo Totale',value:formatDuration(totalTime),icon:'⏱️',color:'hsl(var(--violet))'}].map(s => (
          <div key={s.label} className="rpg-card" style={{ padding:'1rem', textAlign:'center' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.25rem' }}>{s.icon}</div>
            <div style={{ fontSize:'1.5rem', fontWeight:'bold', fontFamily:'var(--font-serif)', color:s.color }}>{s.value}</div>
            <div style={{ fontSize:'0.75rem', color:'hsl(var(--muted-foreground))', marginTop:'0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {(logs as any[]).length === 0 ? (
        <div className="rpg-card" style={{ padding:'3rem', textAlign:'center', color:'hsl(var(--muted-foreground))' }}><div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>📜</div><p>Nessuna quest registrata</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {(logs as any[]).map((log:any) => (
            <div key={log.id} className="rpg-card" style={{ overflow:'hidden' }}>
              <button onClick={() => setExpanded(expanded===log.id?null:log.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:'1rem', padding:'1rem', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <div style={{ width:'3rem', height:'3rem', borderRadius:'0.5rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', background:'hsl(var(--gold-tint-strong))', border:'1px solid hsl(var(--gold-line))', flexShrink:0 }}>⚔️</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.name}</div>
                  <div style={{ fontSize:'0.75rem', color:'hsl(var(--muted-foreground))' }}>{formatDate(log.completedAt)}{log.durationMinutes?` · ${formatDuration(log.durationMinutes)}`:''} · {(log.exercises||[]).length} esercizi</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:'bold', fontFamily:'var(--font-mono)', color:'hsl(var(--xp))' }}>+{log.xpEarned} XP</div>
                  <div style={{ fontSize:'0.75rem', color:'hsl(var(--muted-foreground))', marginTop:'0.25rem' }}>{expanded===log.id?'▲':'▼'}</div>
                </div>
              </button>
              {expanded===log.id && (
                <div style={{ padding:'0 1rem 1rem', borderTop:'1px solid hsl(var(--border))' }}>
                  {log.notes && <p style={{ fontSize:'0.875rem', fontStyle:'italic', color:'hsl(var(--muted-foreground))', padding:'0.75rem 0' }}>"{log.notes}"</p>}
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.5rem' }}>
                    {(log.exercises||[]).map((ex:any,i:number) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0.75rem', borderRadius:'0.5rem', background:'hsl(var(--muted))' }}>
                        <span style={{ fontSize:'1.25rem' }}>💪</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'0.875rem', fontWeight:500 }}>{ex.name}</div>
                          {(ex.sets||[]).length>0 && <div style={{ fontSize:'0.75rem', color:'hsl(var(--muted-foreground))', fontFamily:'var(--font-mono)' }}>{ex.sets.map((s:any,j:number)=>`${j>0?' · ':''}${s.reps||s.seconds}×${s.weight}kg`)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
