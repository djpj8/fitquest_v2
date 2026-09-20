import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const CLASSES = [
  { id: 'warrior', name: 'Warrior', icon: '⚔️', desc: 'Forza e potenza' },
  { id: 'mage', name: 'Mage', icon: '🔮', desc: 'Tecnica e disciplina' },
  { id: 'ranger', name: 'Ranger', icon: '🏹', desc: 'Velocità e resistenza' },
];

export default function AuthPage() {
  const { login, register, loginError, registerError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedClass, setSelectedClass] = useState('warrior');
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register({ ...form, avatarClass: selectedClass });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', outline: 'none', fontSize: '0.875rem', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'hsl(var(--background))' }}>
      <div style={{ width: '100%', maxWidth: '26rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>⚔️</div>
          <h1 className="gold-shimmer" style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '0.25rem' }}>FitQuest</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Level up your life — v2.0</p>
        </div>

        <div className="rpg-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontFamily: 'var(--font-serif)', background: mode === m ? 'hsl(var(--primary))' : 'transparent', color: mode === m ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))' }}>
                {m === 'login' ? 'Entra' : 'Registrati'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'register' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>NOME EROE</label>
                  <input style={inp} type="text" required value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Il tuo nome" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>USERNAME</label>
                  <input style={inp} type="text" required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="@username" />
                </div>
              </>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>EMAIL</label>
              <input style={inp} type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="eroe@fitquest.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>PASSWORD</label>
              <input style={inp} type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'hsl(var(--primary))', letterSpacing: '0.1em' }}>CLASSE</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {CLASSES.map(cls => (
                    <button key={cls.id} type="button" onClick={() => setSelectedClass(cls.id)}
                      style={{ padding: '0.75rem 0.5rem', borderRadius: '0.5rem', textAlign: 'center', cursor: 'pointer', border: `1px solid ${selectedClass === cls.id ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, background: selectedClass === cls.id ? 'hsl(43 85% 55% / 0.15)' : 'hsl(var(--muted))' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{cls.icon}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: selectedClass === cls.id ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{cls.name}</div>
                      <div style={{ fontSize: '0.6rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>{cls.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(0 70% 50% / 0.15)', color: 'hsl(0 70% 65%)', border: '1px solid hsl(0 70% 35%)', fontSize: '0.875rem' }}>{error}</div>}

            <button type="submit" disabled={loading}
              style={{ padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: loading ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(43 85% 45%), hsl(43 85% 60%))', color: 'hsl(220 20% 6%)' }}>
              {loading ? '⏳ Caricamento...' : mode === 'login' ? '⚔️ Entra nel Reame' : '🏆 Inizia l\'Avventura'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '1rem', color: 'hsl(var(--muted-foreground))' }}>
            Contatti: <a href="mailto:djpj8.09@gmail.com" style={{ color: 'hsl(var(--primary))' }}>djpj8.09@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
