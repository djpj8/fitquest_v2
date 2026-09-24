// Classi personaggio: unica fonte di verità per Auth, Sidebar, Profilo e Classifica.
// Gli id devono coincidere con VALID_CLASSES in worker/src/index.js.

export interface HeroClass {
  id: string;
  name: string;
  icon: string;
  desc: string;
  focus: string;
}

export const CLASSES: HeroClass[] = [
  { id: 'warrior', name: 'Warrior', icon: '⚔️', desc: 'Forza e potenza', focus: 'Ideale per chi ama i carichi pesanti e i movimenti base.' },
  { id: 'mage', name: 'Mage', icon: '🔮', desc: 'Tecnica e disciplina', focus: 'Per chi cura ogni dettaglio dell\'esecuzione.' },
  { id: 'ranger', name: 'Ranger', icon: '🏹', desc: 'Velocità e resistenza', focus: 'Cardio, corsa e allenamenti ad alto ritmo.' },
  { id: 'paladin', name: 'Paladin', icon: '🛡️', desc: 'Equilibrio e solidità', focus: 'Forza e resistenza in parti uguali, senza punti deboli.' },
  { id: 'rogue', name: 'Rogue', icon: '🗡️', desc: 'Agilità e rapidità', focus: 'Corpo libero, salti e movimenti esplosivi.' },
  { id: 'monk', name: 'Monk', icon: '🥋', desc: 'Controllo e mobilità', focus: 'Calisthenics, equilibrio e padronanza del corpo.' },
  { id: 'druid', name: 'Druid', icon: '🌿', desc: 'Allenamento naturale', focus: 'All\'aperto, costanza e ritmo sostenibile.' },
  { id: 'samurai', name: 'Samurai', icon: '⛩️', desc: 'Disciplina e costanza', focus: 'Routine rigorose e progressi giorno dopo giorno.' },
];

const BY_ID = new Map(CLASSES.map(c => [c.id, c]));

export function classIcon(id: string | undefined | null): string {
  return (id && BY_ID.get(id)?.icon) || '⚔️';
}

export function classInfo(id: string | undefined | null): HeroClass {
  return (id && BY_ID.get(id)) || CLASSES[0];
}

// Titolo mostrato nella scheda del browser per ogni pagina
export const PAGE_TITLES: Record<string, string> = {
  'dashboard': 'Dashboard',
  'log-workout': 'Registra allenamento',
  'routines': 'Routine',
  'programs': 'Programmi',
  'history': 'Cronologia',
  'achievements': 'Achievement',
  'leaderboard': 'Classifica',
  'body-tracker': 'Body Tracker',
  'exercise-stats': 'Statistiche',
  'profile': 'Profilo',
};
