import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { clearToken } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

export default function Profile({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user, logout, setTheme } = useAuth();
  const qc = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;
  const isDark = user.theme !== 'light';

  const handleDelete = async () => {
    if (deleteInput !== user.username) { setError(`Scrivi "${user.username}" per confermare`); return; }
    setDeleting(true);
    try {
      await api.del('/auth/account');
      clearToken();
      qc.clear();
      await logout();
    } catch (e: any) { setError(e.message); setDeleting(false); }
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fitquest_theme', next);
    setTheme(next);
  };

  return (
    <div style={{ padding:'1.5rem', maxWidth:'36rem' }} className="fade-in">
      <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.875rem', marginBottom:'1.5rem' }}>⚙️ Profilo</h1>

      <div className="rpg-card" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'1.1rem', marginBottom:'1rem' }}>Informazioni account</h2>
        {[['Nome',user.displayName||'—'],['Username',`@${user.username}`],['Email',user.email],['Classe',user.avatarClass],['Livello',String(user.level)],['XP Totali',user.totalXp?.toLocaleString()]].map(([l,v]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid hsl(var(--border))' }}>
            <span style={{ color:'hsl(var(--muted-foreground))', fontSize:'0.875rem' }}>{l}</span>
            <span style={{ fontWeight:500, textTransform:'capitalize' }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="rpg-card" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'1.1rem', marginBottom:'1rem' }}>🎨 Tema</h2>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'0.875rem', color:'hsl(var(--muted-foreground))' }}>{isDark ? '🌙 Tema scuro' : '☀️ Tema chiaro'}</span>
          <button onClick={toggleTheme} style={{ padding:'0.5rem 1rem', borderRadius:'0.5rem', fontWeight:'bold', cursor:'pointer', border:'1px solid hsl(var(--border))', background:'hsl(var(--muted))', color:'hsl(var(--foreground))' }}>
            Passa a {isDark ? 'chiaro ☀️' : 'scuro 🌙'}
          </button>
        </div>
      </div>

      <div className="rpg-card" style={{ padding:'1.25rem', marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'1.1rem', marginBottom:'0.75rem' }}>Info</h2>
        <p style={{ fontSize:'0.875rem', color:'hsl(var(--muted-foreground))' }}>
          FitQuest v2.0 · Contatti: <a href="mailto:djpj8.09@gmail.com" style={{ color:'hsl(var(--primary))' }}>djpj8.09@gmail.com</a>
        </p>
        <p style={{ fontSize:'0.875rem', color:'hsl(var(--muted-foreground))', marginTop:'0.5rem' }}>
          Titolare: Parisi Alessandro · I tuoi dati sono al sicuro e non vengono ceduti a terzi.
        </p>
      </div>

      <div className="rpg-card" style={{ padding:'1.25rem', borderColor:'hsl(var(--destructive-border))' }}>
        <h2 style={{ fontSize:'1.1rem', color:'hsl(var(--destructive))', marginBottom:'0.75rem' }}>⚠️ Zona pericolosa</h2>
        {!showDelete ? (
          <>
            <p style={{ fontSize:'0.875rem', color:'hsl(var(--muted-foreground))', marginBottom:'1rem' }}>Elimina account e tutti i dati in modo permanente.</p>
            <button onClick={() => setShowDelete(true)} style={{ padding:'0.625rem 1.25rem', borderRadius:'0.5rem', cursor:'pointer', background:'hsl(0 70% 50% / 0.15)', color:'hsl(var(--destructive))', border:'1px solid hsl(var(--destructive-border))', fontWeight:'bold', fontFamily:'var(--font-serif)' }}>🗑️ Elimina account</button>
          </>
        ) : (
          <>
            <p style={{ fontSize:'0.875rem', color:'hsl(var(--muted-foreground))', marginBottom:'0.75rem' }}>Scrivi <strong style={{ color:'hsl(var(--foreground))' }}>{user.username}</strong> per confermare:</p>
            <input value={deleteInput} onChange={e => { setDeleteInput(e.target.value); setError(''); }} placeholder={user.username} style={{ width:'100%', padding:'0.5rem 0.75rem', borderRadius:'0.5rem', background:'hsl(var(--input))', border:'1px solid hsl(var(--destructive-border))', color:'hsl(var(--foreground))', outline:'none', marginBottom:'0.75rem', boxSizing:'border-box' }} />
            {error && <p style={{ color:'hsl(var(--destructive))', fontSize:'0.85rem', marginBottom:'0.75rem' }}>{error}</p>}
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button onClick={() => { setShowDelete(false); setDeleteInput(''); }} style={{ flex:1, padding:'0.625rem', borderRadius:'0.5rem', cursor:'pointer', background:'hsl(var(--muted))', border:'1px solid hsl(var(--border))', color:'hsl(var(--foreground))' }}>Annulla</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:'0.625rem', borderRadius:'0.5rem', cursor:'pointer', background:'hsl(var(--destructive))', border:'none', color:'white', fontWeight:'bold', fontFamily:'var(--font-serif)' }}>{deleting?'⏳...':'🗑️ Conferma'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
