// FitQuest v2.0 - Cloudflare Worker API

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// Simple hash (SHA-256 via Web Crypto)
async function hashPassword(password) {
  const data = new TextEncoder().encode(password + 'fitquest_v2_salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple JWT-like token (base64 encoded JSON + signature)
async function createToken(userId) {
  const payload = JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = btoa(payload);
  const sig = await hashPassword(encoded + 'fitquest_jwt_secret');
  return `${encoded}.${sig.slice(0, 16)}`;
}

async function verifyToken(token) {
  if (!token) return null;
  try {
    const [encoded, sig] = token.split('.');
    const expectedSig = (await hashPassword(encoded + 'fitquest_jwt_secret')).slice(0, 16);
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(atob(encoded));
    if (payload.exp < Date.now()) return null;
    return payload.userId;
  } catch { return null; }
}

function getToken(request) {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function getLevelFromTotalXp(totalXp) {
  let level = 1, accumulated = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (accumulated + needed > totalXp) return { level, currentXp: totalXp - accumulated, xpToNextLevel: needed };
    accumulated += needed;
    level++;
  }
}

async function addXp(DB, userId, xp) {
  const user = await DB.prepare('SELECT total_xp FROM users WHERE id = ?').bind(userId).first();
  const newTotal = (user?.total_xp || 0) + xp;
  const { level, currentXp } = getLevelFromTotalXp(newTotal);
  await DB.prepare('UPDATE users SET total_xp = ?, xp = ?, level = ? WHERE id = ?').bind(newTotal, currentXp, level, userId).run();
}

// Classi disponibili (devono coincidere con quelle del frontend)
const VALID_CLASSES = ['warrior', 'mage', 'ranger', 'paladin', 'rogue', 'monk', 'druid', 'samurai'];

// Giorni consecutivi di allenamento (a partire da oggi o da ieri)
function calcStreak(dates) {
  const days = new Set(dates.map(d => String(d).slice(0, 10)));
  const fmt = d => d.toISOString().slice(0, 10);
  let cursor = new Date();
  if (!days.has(fmt(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(fmt(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

async function checkAchievements(DB, userId) {
  const q = (sql, ...b) => DB.prepare(sql).bind(...b).first();
  const logsCount = (await q('SELECT COUNT(*) as c FROM workout_logs WHERE user_id = ?', userId))?.c || 0;
  const user = await q('SELECT level, total_xp FROM users WHERE id = ?', userId);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const weekCount = (await q('SELECT COUNT(*) as c FROM workout_logs WHERE user_id = ? AND completed_at >= ?', userId, weekAgo))?.c || 0;
  const monthCount = (await q('SELECT COUNT(*) as c FROM workout_logs WHERE user_id = ? AND completed_at >= ?', userId, monthAgo))?.c || 0;
  const measCount = (await q('SELECT COUNT(*) as c FROM body_measurements WHERE user_id = ?', userId))?.c || 0;
  const favCount = (await q('SELECT COUNT(*) as c FROM favorite_exercises WHERE user_id = ?', userId))?.c || 0;
  const routineCount = (await q('SELECT COUNT(*) as c FROM routines WHERE user_id = ?', userId))?.c || 0;
  const programCount = (await q('SELECT COUNT(*) as c FROM programs WHERE user_id = ?', userId))?.c || 0;
  const customCount = (await q('SELECT COUNT(*) as c FROM exercises WHERE user_id = ?', userId))?.c || 0;
  const agg = await q('SELECT SUM(duration_minutes) as dur, MAX(duration_minutes) as maxdur FROM workout_logs WHERE user_id = ?', userId);
  const { results: dateRows } = await DB.prepare('SELECT completed_at FROM workout_logs WHERE user_id = ? ORDER BY completed_at DESC LIMIT 400').bind(userId).all();
  const streak = calcStreak((dateRows || []).map(r => r.completed_at));

  // Analisi dei log: varieta' di esercizi, categorie, serie, peso massimo, orari
  const { results: logRows } = await DB.prepare('SELECT exercises, completed_at FROM workout_logs WHERE user_id = ? ORDER BY completed_at DESC LIMIT 300').bind(userId).all();
  const names = new Set();
  const cats = new Set();
  let totalSets = 0, maxWeight = 0, maxExInOne = 0, earlyBird = false, nightOwl = false, weekend = false;
  const catMap = await DB.prepare('SELECT name, category FROM exercises').all();
  const catByName = new Map((catMap.results || []).map(e => [e.name, e.category]));
  for (const row of logRows || []) {
    let exs = [];
    try { exs = JSON.parse(row.exercises || '[]'); } catch { exs = []; }
    maxExInOne = Math.max(maxExInOne, exs.length);
    for (const ex of exs) {
      names.add(ex.name);
      if (catByName.get(ex.name)) cats.add(catByName.get(ex.name));
      for (const st of ex.sets || []) { totalSets++; maxWeight = Math.max(maxWeight, st.weight || 0); }
    }
    const d = new Date(row.completed_at.replace(' ', 'T') + (row.completed_at.includes('Z') ? '' : 'Z'));
    const h = d.getUTCHours(), wd = d.getUTCDay();
    if (h >= 4 && h < 7) earlyBird = true;
    if (h >= 21 || h < 4) nightOwl = true;
    if (wd === 0 || wd === 6) weekend = true;
  }
  const lastWorkout = logRows?.[0];
  let lastNames = [];
  try { lastNames = JSON.parse(lastWorkout?.exercises || '[]').map(e => e.name.toLowerCase()); } catch {}
  const hasCalisthenicsStatic = names.has('Planche') || names.has('Front Lever') || names.has('Human Flag') || names.has('Back Lever') || names.has('Muscle-Up');
  const totalXp = user?.total_xp || 0;
  const level = user?.level || 1;

  const checks = [
    // Allenamenti totali
    { key: 'first_workout', ok: logsCount >= 1 },
    { key: 'five_workouts', ok: logsCount >= 5 },
    { key: 'ten_workouts', ok: logsCount >= 10 },
    { key: 'twentyfive_workouts', ok: logsCount >= 25 },
    { key: 'fifty_workouts', ok: logsCount >= 50 },
    { key: 'hundred_workouts', ok: logsCount >= 100 },
    // Livelli
    { key: 'level_5', ok: level >= 5 },
    { key: 'level_10', ok: level >= 10 },
    { key: 'level_15', ok: level >= 15 },
    { key: 'level_20', ok: level >= 20 },
    { key: 'level_30', ok: level >= 30 },
    // XP totali
    { key: 'xp_1000', ok: totalXp >= 1000 },
    { key: 'xp_10000', ok: totalXp >= 10000 },
    // Costanza
    { key: 'streak_week', ok: weekCount >= 5 },
    { key: 'streak_3days', ok: streak >= 3 },
    { key: 'streak_7days', ok: streak >= 7 },
    { key: 'streak_14days', ok: streak >= 14 },
    { key: 'month_12', ok: monthCount >= 12 },
    { key: 'weekend_warrior', ok: weekend },
    { key: 'early_bird', ok: earlyBird },
    { key: 'night_owl', ok: nightOwl },
    // Sessione
    { key: 'marathon', ok: (agg?.maxdur || 0) >= 90 },
    { key: 'hours_10', ok: (agg?.dur || 0) >= 600 },
    { key: 'hours_50', ok: (agg?.dur || 0) >= 3000 },
    { key: 'big_session', ok: maxExInOne >= 6 },
    // Varieta'
    { key: 'variety_10', ok: names.size >= 10 },
    { key: 'variety_25', ok: names.size >= 25 },
    { key: 'all_rounder', ok: cats.size >= 6 },
    { key: 'sets_100', ok: totalSets >= 100 },
    { key: 'sets_500', ok: totalSets >= 500 },
    { key: 'heavy_100', ok: maxWeight >= 100 },
    { key: 'calisthenics_master', ok: hasCalisthenicsStatic },
    // Organizzazione
    { key: 'first_routine', ok: routineCount >= 1 },
    { key: 'first_program', ok: programCount >= 1 },
    { key: 'custom_exercise', ok: customCount >= 1 },
    { key: 'favorites_5', ok: favCount >= 5 },
    // Corpo
    { key: 'first_measurement', ok: measCount >= 1 },
    { key: 'weight_loss', ok: measCount >= 10 },
    { key: 'measurements_30', ok: measCount >= 30 },
  ];

  const unlocked = [];
  for (const check of checks) {
    if (!check.ok) continue;
    const ach = await DB.prepare('SELECT id, xp_reward FROM achievements WHERE key = ?').bind(check.key).first();
    if (!ach) continue; // achievement non ancora presente nel DB: ignora
    const existing = await DB.prepare('SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?').bind(userId, ach.id).first();
    if (!existing) {
      await DB.prepare('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').bind(userId, ach.id).run();
      await addXp(DB, userId, ach.xp_reward);
      unlocked.push(check.key);
    }
  }
  return unlocked;
}

export default {
  async fetch(request, env) {
    const { DB } = env;
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    // Get auth user
    const userId = await verifyToken(getToken(request));

    // ── Auth ──────────────────────────────────────────────────────────────────

    if (path === '/auth/register' && method === 'POST') {
      const { username, email, password, displayName, avatarClass } = await request.json();
      if (!username || !email || !password) return err('Campi mancanti');
      const existing = await DB.prepare('SELECT id FROM users WHERE email = ? OR username = ?').bind(email, username).first();
      if (existing) return err('Email o username già in uso');
      const hashed = await hashPassword(password);
      const result = await DB.prepare('INSERT INTO users (username, email, password, display_name, avatar_class) VALUES (?, ?, ?, ?, ?)').bind(username, email, hashed, displayName || username, VALID_CLASSES.includes(avatarClass) ? avatarClass : 'warrior').run();
      const newUserId = result.meta.last_row_id;
      const token = await createToken(newUserId);
      const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(newUserId).first();
      const { level, currentXp, xpToNextLevel } = getLevelFromTotalXp(user.total_xp);
      return json({ token, user: { id: user.id, username: user.username, email: user.email, displayName: user.display_name, avatarClass: user.avatar_class, theme: user.theme || 'dark', level, currentXp, xpToNextLevel, totalXp: user.total_xp } });
    }

    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      const hashed = await hashPassword(password);
      const user = await DB.prepare('SELECT * FROM users WHERE email = ? AND password = ?').bind(email, hashed).first();
      if (!user) return err('Credenziali non valide', 401);
      const token = await createToken(user.id);
      const { level, currentXp, xpToNextLevel } = getLevelFromTotalXp(user.total_xp);
      return json({ token, user: { id: user.id, username: user.username, email: user.email, displayName: user.display_name, avatarClass: user.avatar_class, theme: user.theme || 'dark', level, currentXp, xpToNextLevel, totalXp: user.total_xp } });
    }

    if (path === '/auth/me' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
      if (!user) return err('Utente non trovato', 404);
      const { level, currentXp, xpToNextLevel } = getLevelFromTotalXp(user.total_xp);
      return json({ id: user.id, username: user.username, email: user.email, displayName: user.display_name, avatarClass: user.avatar_class, theme: user.theme || 'dark', level, currentXp, xpToNextLevel, totalXp: user.total_xp });
    }

    if (path === '/auth/theme' && method === 'PUT') {
      if (!userId) return err('Non autorizzato', 401);
      const { theme } = await request.json();
      await DB.prepare('UPDATE users SET theme = ? WHERE id = ?').bind(theme, userId).run();
      return json({ ok: true });
    }

    if (path === '/auth/class' && method === 'PUT') {
      if (!userId) return err('Non autorizzato', 401);
      const { avatarClass } = await request.json();
      if (!VALID_CLASSES.includes(avatarClass)) return err('Classe non valida');
      await DB.prepare('UPDATE users SET avatar_class = ? WHERE id = ?').bind(avatarClass, userId).run();
      return json({ ok: true, avatarClass });
    }

    // ── Classifica ────────────────────────────────────────────────────────────

    if (path === '/leaderboard' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results } = await DB.prepare(
        `SELECT u.id, u.username, u.display_name, u.avatar_class, u.total_xp,
                (SELECT COUNT(*) FROM workout_logs w WHERE w.user_id = u.id) AS workouts
         FROM users u ORDER BY u.total_xp DESC, u.id ASC LIMIT 50`
      ).all();
      const board = results.map((r, i) => {
        const { level } = getLevelFromTotalXp(r.total_xp || 0);
        return { rank: i + 1, id: r.id, username: r.username, displayName: r.display_name || r.username, avatarClass: r.avatar_class, totalXp: r.total_xp || 0, level, workouts: r.workouts || 0, isMe: r.id === userId };
      });
      let me = board.find(b => b.isMe) || null;
      if (!me) {
        const u = await DB.prepare('SELECT id, username, display_name, avatar_class, total_xp FROM users WHERE id = ?').bind(userId).first();
        if (u) {
          const ahead = await DB.prepare('SELECT COUNT(*) as c FROM users WHERE total_xp > ?').bind(u.total_xp || 0).first();
          const w = await DB.prepare('SELECT COUNT(*) as c FROM workout_logs WHERE user_id = ?').bind(userId).first();
          const { level } = getLevelFromTotalXp(u.total_xp || 0);
          me = { rank: (ahead?.c || 0) + 1, id: u.id, username: u.username, displayName: u.display_name || u.username, avatarClass: u.avatar_class, totalXp: u.total_xp || 0, level, workouts: w?.c || 0, isMe: true };
        }
      }
      const total = await DB.prepare('SELECT COUNT(*) as c FROM users').first();
      return json({ board, me, totalPlayers: total?.c || 0 });
    }

    if (path === '/auth/account' && method === 'DELETE') {
      if (!userId) return err('Non autorizzato', 401);
      await DB.prepare('DELETE FROM user_achievements WHERE user_id = ?').bind(userId).run();
      await DB.prepare('DELETE FROM body_measurements WHERE user_id = ?').bind(userId).run();
      await DB.prepare('DELETE FROM favorite_exercises WHERE user_id = ?').bind(userId).run();
      await DB.prepare('DELETE FROM workout_logs WHERE user_id = ?').bind(userId).run();
      await DB.prepare('DELETE FROM routines WHERE user_id = ?').bind(userId).run();
      await DB.prepare('DELETE FROM programs WHERE user_id = ?').bind(userId).run();
      await DB.prepare('DELETE FROM exercises WHERE user_id = ?').bind(userId).run();
      await DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
      return json({ ok: true });
    }

    // ── Exercises ─────────────────────────────────────────────────────────────

    if (path === '/exercises' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results } = await DB.prepare('SELECT * FROM exercises WHERE user_id IS NULL OR user_id = ? ORDER BY name').bind(userId).all();
      return json(results.map(e => ({ ...e, muscleGroups: e.muscle_groups ? e.muscle_groups.split(',') : [], xpReward: e.xp_reward, userId: e.user_id })));
    }

    if (path === '/exercises' && method === 'POST') {
      if (!userId) return err('Non autorizzato', 401);
      const { name, category, type, muscleGroups } = await request.json();
      const result = await DB.prepare('INSERT INTO exercises (name, category, type, muscle_groups, xp_reward, user_id) VALUES (?, ?, ?, ?, 12, ?)').bind(name, category, type || 'gym', Array.isArray(muscleGroups) ? muscleGroups.join(',') : '', userId).run();
      return json({ id: result.meta.last_row_id, name, category, type, muscleGroups, xpReward: 12, userId });
    }

    if (path.match(/^\/exercises\/(\d+)$/) && method === 'DELETE') {
      if (!userId) return err('Non autorizzato', 401);
      const id = path.match(/^\/exercises\/(\d+)$/)[1];
      await DB.prepare('DELETE FROM exercises WHERE id = ? AND user_id = ?').bind(id, userId).run();
      return json({ ok: true });
    }

    if (path === '/exercises/favorites' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results } = await DB.prepare('SELECT e.* FROM favorite_exercises fe JOIN exercises e ON fe.exercise_id = e.id WHERE fe.user_id = ? ORDER BY e.name').bind(userId).all();
      return json(results.map(e => ({ ...e, muscleGroups: e.muscle_groups ? e.muscle_groups.split(',') : [], xpReward: e.xp_reward })));
    }

    if (path.match(/^\/exercises\/(\d+)\/favorite$/) && method === 'POST') {
      if (!userId) return err('Non autorizzato', 401);
      const exId = path.match(/^\/exercises\/(\d+)\/favorite$/)[1];
      const existing = await DB.prepare('SELECT id FROM favorite_exercises WHERE user_id = ? AND exercise_id = ?').bind(userId, exId).first();
      if (existing) {
        await DB.prepare('DELETE FROM favorite_exercises WHERE user_id = ? AND exercise_id = ?').bind(userId, exId).run();
        return json({ favorited: false });
      }
      await DB.prepare('INSERT INTO favorite_exercises (user_id, exercise_id) VALUES (?, ?)').bind(userId, exId).run();
      return json({ favorited: true });
    }

    // ── Body Measurements ─────────────────────────────────────────────────────

    if (path === '/measurements' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results } = await DB.prepare('SELECT * FROM body_measurements WHERE user_id = ? ORDER BY measured_at DESC LIMIT 50').bind(userId).all();
      return json(results.map(m => ({ ...m, weightKg: m.weight_kg, heightCm: m.height_cm, measuredAt: m.measured_at })));
    }

    if (path === '/measurements' && method === 'POST') {
      if (!userId) return err('Non autorizzato', 401);
      const { weightKg, heightCm, notes } = await request.json();
      if (!weightKg) return err('Peso obbligatorio');
      const result = await DB.prepare('INSERT INTO body_measurements (user_id, weight_kg, height_cm, notes) VALUES (?, ?, ?, ?)').bind(userId, weightKg, heightCm || null, notes || null).run();
      const newAchievements = await checkAchievements(DB, userId);
      return json({ id: result.meta.last_row_id, weightKg, heightCm, notes, measuredAt: new Date().toISOString(), newAchievements });
    }

    if (path.match(/^\/measurements\/(\d+)$/) && method === 'DELETE') {
      if (!userId) return err('Non autorizzato', 401);
      const id = path.match(/^\/measurements\/(\d+)$/)[1];
      await DB.prepare('DELETE FROM body_measurements WHERE id = ? AND user_id = ?').bind(id, userId).run();
      return json({ ok: true });
    }

    // ── Routines ──────────────────────────────────────────────────────────────

    if (path === '/routines' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results } = await DB.prepare('SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
      return json(results.map(r => ({ ...r, exercises: JSON.parse(r.exercises || '[]'), userId: r.user_id })));
    }

    if (path === '/routines' && method === 'POST') {
      if (!userId) return err('Non autorizzato', 401);
      const { name, exercises } = await request.json();
      const result = await DB.prepare('INSERT INTO routines (user_id, name, exercises) VALUES (?, ?, ?)').bind(userId, name, JSON.stringify(exercises || [])).run();
      return json({ id: result.meta.last_row_id, name, exercises: exercises || [], userId });
    }

    if (path.match(/^\/routines\/(\d+)$/) && method === 'PUT') {
      if (!userId) return err('Non autorizzato', 401);
      const id = path.match(/^\/routines\/(\d+)$/)[1];
      const { name, exercises } = await request.json();
      await DB.prepare('UPDATE routines SET name = ?, exercises = ? WHERE id = ? AND user_id = ?').bind(name, JSON.stringify(exercises || []), id, userId).run();
      return json({ ok: true });
    }

    if (path.match(/^\/routines\/(\d+)$/) && method === 'DELETE') {
      if (!userId) return err('Non autorizzato', 401);
      const id = path.match(/^\/routines\/(\d+)$/)[1];
      await DB.prepare('DELETE FROM routines WHERE id = ? AND user_id = ?').bind(id, userId).run();
      return json({ ok: true });
    }

    // ── Programs ──────────────────────────────────────────────────────────────

    if (path === '/programs' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results } = await DB.prepare('SELECT * FROM programs WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
      return json(results.map(p => ({ ...p, userId: p.user_id, daysPerWeek: p.days_per_week, isPublic: !!p.is_public })));
    }

    if (path === '/programs' && method === 'POST') {
      if (!userId) return err('Non autorizzato', 401);
      const { name, description, daysPerWeek, difficulty, isPublic } = await request.json();
      const result = await DB.prepare('INSERT INTO programs (user_id, name, description, days_per_week, difficulty, is_public) VALUES (?, ?, ?, ?, ?, ?)').bind(userId, name, description || '', daysPerWeek || 3, difficulty || 'beginner', isPublic ? 1 : 0).run();
      return json({ id: result.meta.last_row_id, name, description, daysPerWeek, difficulty, userId });
    }

    if (path.match(/^\/programs\/(\d+)$/) && method === 'PUT') {
      if (!userId) return err('Non autorizzato', 401);
      const id = path.match(/^\/programs\/(\d+)$/)[1];
      const { name, description, daysPerWeek, difficulty, isPublic } = await request.json();
      await DB.prepare('UPDATE programs SET name = ?, description = ?, days_per_week = ?, difficulty = ?, is_public = ? WHERE id = ? AND user_id = ?').bind(name, description, daysPerWeek, difficulty, isPublic ? 1 : 0, id, userId).run();
      return json({ ok: true });
    }

    if (path.match(/^\/programs\/(\d+)$/) && method === 'DELETE') {
      if (!userId) return err('Non autorizzato', 401);
      const id = path.match(/^\/programs\/(\d+)$/)[1];
      await DB.prepare('DELETE FROM programs WHERE id = ? AND user_id = ?').bind(id, userId).run();
      return json({ ok: true });
    }

    // ── Workouts ──────────────────────────────────────────────────────────────

    if (path === '/workouts' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results } = await DB.prepare('SELECT * FROM workout_logs WHERE user_id = ? ORDER BY completed_at DESC LIMIT 50').bind(userId).all();
      return json(results.map(l => ({ ...l, exercises: JSON.parse(l.exercises || '[]'), xpEarned: l.xp_earned, durationMinutes: l.duration_minutes, completedAt: l.completed_at })));
    }

    if (path === '/workouts' && method === 'POST') {
      if (!userId) return err('Non autorizzato', 401);
      const { name, exercises, durationMinutes, notes, routineId } = await request.json();
      let xpEarned = 20 + Math.floor((durationMinutes || 0) * 0.5);
      if (Array.isArray(exercises)) xpEarned += exercises.reduce((s, ex) => s + (ex.sets?.length || 0) * 10, 0);
      const result = await DB.prepare('INSERT INTO workout_logs (user_id, routine_id, name, exercises, duration_minutes, xp_earned, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(userId, routineId || null, name, JSON.stringify(exercises || []), durationMinutes || null, xpEarned, notes || null).run();
      await addXp(DB, userId, xpEarned);
      const newAchievements = await checkAchievements(DB, userId);
      const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
      const { level, currentXp, xpToNextLevel } = getLevelFromTotalXp(user.total_xp);
      return json({ id: result.meta.last_row_id, xpEarned, newAchievements, user: { ...user, level, currentXp, xpToNextLevel, totalXp: user.total_xp, displayName: user.display_name, avatarClass: user.avatar_class, theme: user.theme || 'dark' } });
    }

    if (path === '/workouts/stats' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const total = await DB.prepare('SELECT COUNT(*) as c, SUM(xp_earned) as xp, SUM(duration_minutes) as dur FROM workout_logs WHERE user_id = ?').bind(userId).first();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recent = await DB.prepare('SELECT * FROM workout_logs WHERE user_id = ? AND completed_at >= ? ORDER BY completed_at DESC').bind(userId, sevenDaysAgo).all();
      return json({ totalWorkouts: total?.c || 0, totalXpEarned: total?.xp || 0, totalDuration: total?.dur || 0, recentWorkouts: recent.results?.length || 0, recentLogs: (recent.results || []).map(l => ({ ...l, xpEarned: l.xp_earned, completedAt: l.completed_at })) });
    }

    // Stats per esercizio
    if (path === '/workouts/exercise-stats' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results } = await DB.prepare('SELECT exercises, completed_at FROM workout_logs WHERE user_id = ? ORDER BY completed_at DESC LIMIT 100').bind(userId).all();
      const statsMap = {};
      for (const log of results) {
        const exs = JSON.parse(log.exercises || '[]');
        for (const ex of exs) {
          if (!statsMap[ex.name]) statsMap[ex.name] = [];
          const maxWeight = Math.max(...(ex.sets || []).map(s => s.weight || 0));
          if (maxWeight > 0) statsMap[ex.name].push({ date: log.completed_at, maxWeight });
        }
      }
      return json(statsMap);
    }

    // ── Achievements ──────────────────────────────────────────────────────────

    if (path === '/achievements' && method === 'GET') {
      if (!userId) return err('Non autorizzato', 401);
      const { results: all } = await DB.prepare('SELECT * FROM achievements').all();
      const { results: userAchs } = await DB.prepare('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?').bind(userId).all();
      const unlockedMap = new Map(userAchs.map(u => [u.achievement_id, u.unlocked_at]));
      return json(all.map(a => ({ ...a, xpReward: a.xp_reward, unlocked: unlockedMap.has(a.id), unlockedAt: unlockedMap.get(a.id) || null })));
    }

    return err('Route non trovata', 404);
  }
};
