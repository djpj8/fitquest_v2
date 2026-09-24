import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import Routines from './pages/Routines';
import Programs from './pages/Programs';
import History from './pages/History';
import Achievements from './pages/Achievements';
import BodyTracker from './pages/BodyTracker';
import ExerciseStats from './pages/ExerciseStats';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import { PAGE_TITLES } from './lib/classes';
import Sidebar from './components/Sidebar';

type Page = 'dashboard' | 'log-workout' | 'routines' | 'programs' | 'history' | 'achievements' | 'body-tracker' | 'exercise-stats' | 'leaderboard' | 'profile';

export default function App() {
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [activeRoutineId, setActiveRoutineId] = useState<number | undefined>();

  // Apply theme from user settings
  useEffect(() => {
    const theme = user?.theme || localStorage.getItem('fitquest_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    // Colore della barra del browser sul telefono
    const meta = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null;
    if (meta) meta.content = theme === 'light' ? '#f3eee2' : '#0d0f14';
  }, [user?.theme]);

  // Titolo della scheda del browser: "Sezione · FitQuest"
  useEffect(() => {
    document.title = user ? `${PAGE_TITLES[page] || 'FitQuest'} · FitQuest` : 'FitQuest — Allenati come in un gioco di ruolo';
  }, [page, user]);

  // Torna in cima quando cambi sezione
  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);

  const handleNavigate = (p: string, routineId?: number) => {
    setPage(p as Page);
    setActiveRoutineId(routineId);
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/favicon.svg" alt="" width={88} height={88} style={{ marginBottom: '1rem' }} />
        <p className="gold-shimmer" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>Caricamento…</p>
      </div>
    </div>
  );

  if (!user) return <AuthPage />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'log-workout': return <LogWorkout onNavigate={handleNavigate} initialRoutineId={activeRoutineId} />;
      case 'routines': return <Routines onNavigate={handleNavigate} />;
      case 'programs': return <Programs />;
      case 'history': return <History />;
      case 'achievements': return <Achievements />;
      case 'leaderboard': return <Leaderboard />;
      case 'body-tracker': return <BodyTracker />;
      case 'exercise-stats': return <ExerciseStats />;
      case 'profile': return <Profile onNavigate={handleNavigate} />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPage={page} onNavigate={handleNavigate} />
      <main id="main" style={{ flex: 1, minWidth: 0, minHeight: '100vh' }} className="mobile-content-padding">
        {renderPage()}
      </main>
    </div>
  );
}
