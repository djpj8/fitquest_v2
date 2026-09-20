import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

export default function Achievements() {
  const { data: achievements = [] } = useQuery<any[]>({ queryKey: ['achievements'], queryFn: () => api.get('/achievements') });
  const unlocked = (achievements as any[]).filter(a => a.unlocked);
  const locked = (achievements as any[]).filter(a => !a.unlocked);
  const RARITY_ORDER = ['legendary','epic','rare','common'];
  const rarityBorder = (r: string) => r==='legendary'?'hsl(43 85% 45%)':r==='epic'?'hsl(280 60% 45%)':r==='rare'?'hsl(200 70% 40%)':'hsl(var(--border))';

  const AchCard = ({ a }: { a: any }) => (
    <div className="rpg-card" style={{ padding:'1rem', opacity:a.unlocked?1:0.5, borderColor:a.unlocked?rarityBorder(a.rarity):'hsl(var(--border))' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem' }}>
        <div style={{ fontSize:'2.5rem', flexShrink:0, position:'relative' }}>
          {a.icon}
          {!a.unlocked && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', background:'hsl(var(--background) / 0.7)', borderRadius:'4px' }}>🔒</div>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem', flexWrap:'wrap' }}>
            <span style={{ fontWeight:'bold', fontFamily:'var(--font-serif)' }}>{a.name}</span>
            <span className={`rarity-${a.rarity}`} style={{ fontSize:'0.7rem', padding:'0.1rem 0.4rem', borderRadius:'999px', border:'1px solid', fontFamily:'var(--font-mono)' }}>{a.rarity}</span>
          </div>
          <p style={{ fontSize:'0.875rem', color:'hsl(var(--muted-foreground))', marginBottom:'0.5rem' }}>{a.description}</p>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:'bold', fontFamily:'var(--font-mono)', color:'hsl(160 60% 50%)' }}>+{a.xpReward} XP</span>
            {a.unlocked && <span style={{ fontSize:'0.75rem', color:'hsl(var(--muted-foreground))' }}>✓ {formatDate(a.unlockedAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'1.5rem' }} className="fade-in">
      <div style={{ marginBottom:'1.5rem' }}><h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem' }}>🏆 Achievement</h1><p style={{ color:'hsl(var(--muted-foreground))' }}>Trofei dalle tue battaglie</p></div>
      <div className="rpg-card" style={{ padding:'1.25rem', marginBottom:'1.5rem', borderColor:'hsl(43 85% 35%)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
          <span style={{ fontWeight:'bold', fontFamily:'var(--font-serif)', color:'hsl(var(--primary))' }}>Collezione Trofei</span>
          <span style={{ fontFamily:'var(--font-mono)', color:'hsl(var(--muted-foreground))' }}>{unlocked.length} / {achievements.length}</span>
        </div>
        <div className="xp-bar" style={{ height:'0.75rem' }}>
          <div className="xp-bar-fill" style={{ width:achievements.length>0?`${(unlocked.length/achievements.length)*100}%`:'0%', background:'linear-gradient(90deg, hsl(43 85% 40%), hsl(43 95% 60%))' }} />
        </div>
      </div>
      {unlocked.length > 0 && (
        <div style={{ marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.1rem', marginBottom:'0.75rem', color:'hsl(var(--primary))' }}>✨ Sbloccati ({unlocked.length})</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            {RARITY_ORDER.flatMap(r => unlocked.filter(a => a.rarity===r)).map(a => <AchCard key={a.id} a={a} />)}
          </div>
        </div>
      )}
      {locked.length > 0 && (
        <div>
          <h2 style={{ fontSize:'1.1rem', marginBottom:'0.75rem', color:'hsl(var(--muted-foreground))' }}>🔒 Bloccati ({locked.length})</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            {RARITY_ORDER.flatMap(r => locked.filter(a => a.rarity===r)).map(a => <AchCard key={a.id} a={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}
