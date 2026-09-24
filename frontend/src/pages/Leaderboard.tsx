import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { classIcon, classInfo } from '../lib/classes';

interface Entry {
  rank: number; id: number; username: string; displayName: string;
  avatarClass: string; totalXp: number; level: number; workouts: number; isMe: boolean;
}
interface Board { board: Entry[]; me: Entry | null; totalPlayers: number; }

const MEDALS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '🥇', label: 'Primo posto' },
  2: { emoji: '🥈', label: 'Secondo posto' },
  3: { emoji: '🥉', label: 'Terzo posto' },
};

function PodiumCard({ e }: { e: Entry }) {
  const m = MEDALS[e.rank];
  return (
    <div className="rpg-card" style={{
      padding: '1rem 0.5rem', textAlign: 'center',
      borderColor: e.isMe ? 'hsl(var(--primary))' : undefined,
      borderWidth: e.isMe ? '2px' : undefined,
      marginTop: e.rank === 1 ? 0 : '1.25rem',
    }}>
      <div style={{ fontSize: e.rank === 1 ? '2.5rem' : '2rem' }} role="img" aria-label={m.label}>{m.emoji}</div>
      <div className="level-badge" style={{ width: '3.25rem', height: '3.25rem', fontSize: '1.5rem', margin: '0.5rem auto' }}>
        {classIcon(e.avatarClass)}
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'hsl(var(--primary))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 0.25rem' }}>
        {e.displayName}{e.isMe && ' (tu)'}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Livello {e.level}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'hsl(var(--xp))', marginTop: '0.25rem' }}>
        {e.totalXp.toLocaleString('it-IT')} XP
      </div>
    </div>
  );
}

function Row({ e }: { e: Entry }) {
  const cls = classInfo(e.avatarClass);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
      borderRadius: '0.5rem',
      background: e.isMe ? 'hsl(var(--gold-tint-strong))' : 'hsl(var(--muted))',
      border: `${e.isMe ? 2 : 1}px solid ${e.isMe ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
    }}>
      <div style={{ width: '2.25rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0, color: e.rank <= 3 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
        {MEDALS[e.rank] ? <span role="img" aria-label={MEDALS[e.rank].label}>{MEDALS[e.rank].emoji}</span> : `#${e.rank}`}
      </div>
      <div className="level-badge" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.15rem', flexShrink: 0 }}>{classIcon(e.avatarClass)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {e.displayName}{e.isMe && <span style={{ color: 'hsl(var(--primary))', fontWeight: 700 }}> (tu)</span>}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
          @{e.username} · {cls.name} · {e.workouts} {e.workouts === 1 ? 'allenamento' : 'allenamenti'}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'hsl(var(--xp))' }}>{e.totalXp.toLocaleString('it-IT')}</div>
        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Lv. {e.level}</div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<Board>({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard'),
    staleTime: 15_000,
  });

  const board = data?.board ?? [];
  const podium = board.slice(0, 3);
  const rest = board.slice(3);
  const meOutside = data?.me && !board.some(b => b.isMe);
  // Ordine visivo del podio: 2° · 1° · 3°
  const podiumOrder = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;

  return (
    <div className="page-narrow fade-in" style={{ maxWidth: '46rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem' }}>👑 Classifica</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>I migliori eroi, ordinati per XP totali</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', cursor: isFetching ? 'wait' : 'pointer', fontSize: '0.9rem' }}>
          {isFetching ? 'Aggiorno…' : '↻ Aggiorna'}
        </button>
      </div>

      {data?.me && (
        <div className="rpg-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderColor: 'hsl(var(--gold-line))' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>La tua posizione</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>
              #{data.me.rank} <span style={{ fontSize: '1rem', color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>su {data.totalPlayers}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.15rem', color: 'hsl(var(--xp))' }}>{data.me.totalXp.toLocaleString('it-IT')} XP</div>
            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Livello {data.me.level}</div>
          </div>
        </div>
      )}

      {isLoading && <div className="rpg-card" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Caricamento della classifica…</div>}

      {error && (
        <div role="alert" className="rpg-card" style={{ padding: '1.5rem', textAlign: 'center', borderColor: 'hsl(var(--destructive-border))' }}>
          <p style={{ color: 'hsl(var(--destructive))', marginBottom: '0.75rem' }}>Non riesco a caricare la classifica.</p>
          <button onClick={() => refetch()} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', cursor: 'pointer' }}>Riprova</button>
        </div>
      )}

      {!isLoading && !error && board.length === 0 && (
        <div className="rpg-card" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
          Ancora nessun eroe in classifica. Registra un allenamento per comparire!
        </div>
      )}

      {podium.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${podium.length}, minmax(0, 1fr))`, gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'start' }}>
          {podiumOrder.map(e => <PodiumCard key={e.id} e={e} />)}
        </div>
      )}

      {rest.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rest.map(e => <Row key={e.id} e={e} />)}
        </div>
      )}

      {meOutside && data?.me && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', margin: '0.5rem 0' }} aria-hidden="true">⋮</div>
          <Row e={data.me} />
        </div>
      )}

      {data && data.totalPlayers > board.length && (
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginTop: '1rem' }}>
          Mostrati i primi {board.length} di {data.totalPlayers} giocatori.
        </p>
      )}
    </div>
  );
}
