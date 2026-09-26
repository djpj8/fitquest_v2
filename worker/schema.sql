CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display_name TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  avatar_class TEXT DEFAULT 'warrior',
  theme TEXT DEFAULT 'dark',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT DEFAULT 'gym',
  muscle_groups TEXT,
  xp_reward INTEGER DEFAULT 10,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorite_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  UNIQUE(user_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  exercises TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  days_per_week INTEGER DEFAULT 3,
  difficulty TEXT DEFAULT 'beginner',
  is_public INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  routine_id INTEGER REFERENCES routines(id),
  name TEXT NOT NULL,
  exercises TEXT DEFAULT '[]',
  duration_minutes INTEGER,
  xp_earned INTEGER DEFAULT 0,
  notes TEXT,
  completed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS body_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  weight_kg REAL NOT NULL,
  height_cm REAL,
  notes TEXT,
  measured_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  rarity TEXT DEFAULT 'common'
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  unlocked_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, achievement_id)
);

-- Seed exercises
INSERT OR IGNORE INTO exercises (name, category, type, muscle_groups, xp_reward) VALUES
  ('Bench Press','chest','gym','pectorals,triceps',15),
  ('Incline Bench Press','chest','gym','upper pectorals,triceps',15),
  ('Dumbbell Fly','chest','gym','pectorals',12),
  ('Cable Crossover','chest','gym','pectorals',12),
  ('Barbell Row','back','gym','lats,rhomboids,biceps',15),
  ('Lat Pulldown','back','gym','lats,biceps',12),
  ('Seated Cable Row','back','gym','rhomboids,lats',12),
  ('Deadlift','back','gym','lower back,glutes,hamstrings,lats',20),
  ('Squat','legs','gym','quadriceps,glutes,hamstrings',20),
  ('Romanian Deadlift','legs','gym','hamstrings,glutes',15),
  ('Leg Press','legs','gym','quadriceps,glutes',15),
  ('Leg Curl','legs','gym','hamstrings',10),
  ('Leg Extension','legs','gym','quadriceps',10),
  ('Hip Thrust','legs','gym','glutes,hamstrings',14),
  ('Calf Raise','legs','gym','calves',8),
  ('Overhead Press','shoulders','gym','deltoids,triceps',15),
  ('Lateral Raise','shoulders','gym','lateral deltoid',10),
  ('Face Pull','shoulders','gym','rear deltoid,rotator cuff',10),
  ('Arnold Press','shoulders','gym','deltoids,triceps',12),
  ('Barbell Curl','arms','gym','biceps',10),
  ('Hammer Curl','arms','gym','biceps,brachialis',10),
  ('Tricep Pushdown','arms','gym','triceps',10),
  ('Skull Crusher','arms','gym','triceps',12),
  ('Treadmill Run','cardio','gym','cardiovascular,legs',12),
  ('Cycling','cardio','gym','cardiovascular,legs',10),
  ('Rowing Machine','cardio','gym','cardiovascular,back,arms',12),
  ('Push-Up','chest','calisthenics','pectorals,triceps,core',8),
  ('Wide Push-Up','chest','calisthenics','pectorals',8),
  ('Diamond Push-Up','chest','calisthenics','triceps,inner pectorals',10),
  ('Archer Push-Up','chest','calisthenics','pectorals,triceps',14),
  ('Pull-Up','back','calisthenics','lats,biceps,rhomboids',15),
  ('Chin-Up','back','calisthenics','biceps,lats',14),
  ('Inverted Row','back','calisthenics','rhomboids,lats,biceps',12),
  ('Muscle-Up','back','calisthenics','lats,triceps,chest',25),
  ('Bodyweight Squat','legs','calisthenics','quadriceps,glutes',8),
  ('Jump Squat','legs','calisthenics','quadriceps,glutes,calves',12),
  ('Pistol Squat','legs','calisthenics','quadriceps,glutes,balance',20),
  ('Lunges','legs','calisthenics','quadriceps,glutes,hamstrings',10),
  ('Nordic Curl','legs','calisthenics','hamstrings',18),
  ('Handstand Push-Up','shoulders','calisthenics','deltoids,triceps',22),
  ('Pike Push-Up','shoulders','calisthenics','shoulders,triceps',10),
  ('Tricep Dip','arms','calisthenics','triceps,chest',12),
  ('Ring Dip','arms','calisthenics','triceps,chest,stabilizers',16),
  ('Plank','core','calisthenics','core,lower back',8),
  ('Side Plank','core','calisthenics','obliques,core',8),
  ('Hollow Body Hold','core','calisthenics','abs,core',12),
  ('L-Sit','core','calisthenics','abs,hip flexors,triceps',18),
  ('Dragon Flag','core','calisthenics','abs,core',22),
  ('Hanging Leg Raise','core','calisthenics','lower abs,hip flexors',14),
  ('Pike Hold','core','calisthenics','shoulders,core',10),
  ('Burpee','cardio','calisthenics','full body,cardiovascular',14),
  ('Jump Rope','cardio','calisthenics','cardiovascular,calves',10),
  ('Running','cardio','calisthenics','cardiovascular,legs',12),
  ('Handstand','core','calisthenics','shoulders,core,balance',20),
  ('Front Lever','back','calisthenics','lats,core,rhomboids',28),
  ('Back Lever','back','calisthenics','biceps,chest,core',26),
  ('Planche','chest','calisthenics','pectorals,shoulders,core',30),
  ('Human Flag','core','calisthenics','obliques,lats,core',30),
  ('Wall Handstand','shoulders','calisthenics','deltoids,core',15);

-- Seed achievements
INSERT OR IGNORE INTO achievements (key, name, description, icon, xp_reward, rarity) VALUES
  ('first_workout','First Blood','Complete your first workout','⚔️',50,'common'),
  ('ten_workouts','Seasoned Warrior','Complete 10 workouts','🛡️',150,'rare'),
  ('fifty_workouts','Legendary Champion','Complete 50 workouts','👑',500,'legendary'),
  ('level_5','Rising Power','Reach Level 5','⚡',100,'common'),
  ('level_10','Elite Warrior','Reach Level 10','🔥',300,'rare'),
  ('level_20','Mythic Legend','Reach Level 20','💎',1000,'legendary'),
  ('streak_week','Iron Will','Work out 5 times in a week','🏆',200,'epic'),
  ('first_measurement','Body Tracker','Log your first body measurement','📏',50,'common'),
  ('weight_loss','Transformation','Log 10 body measurements','🎯',200,'rare');

-- Achievement aggiuntivi (v2.1)
INSERT OR IGNORE INTO achievements (key, name, description, icon, xp_reward, rarity) VALUES
  ('five_workouts','Apprendista','Completa 5 workout','🗡️',75,'common'),
  ('twentyfive_workouts','Veterano','Completa 25 workout','⚒️',300,'epic'),
  ('hundred_workouts','Centurione','Completa 100 workout','🏛️',1000,'legendary'),
  ('level_15','Campione','Raggiungi il Livello 15','🌟',600,'epic'),
  ('level_30','Semidio','Raggiungi il Livello 30','☀️',2500,'legendary'),
  ('xp_1000','Primo Tesoro','Accumula 1.000 XP totali','💰',100,'common'),
  ('xp_10000','Tesoro del Drago','Accumula 10.000 XP totali','🐉',800,'epic'),
  ('streak_3days','Scintilla','Allenati 3 giorni di fila','✨',100,'common'),
  ('streak_7days','Fiamma Eterna','Allenati 7 giorni di fila','🔥',400,'epic'),
  ('streak_14days','Inarrestabile','Allenati 14 giorni di fila','🌋',1000,'legendary'),
  ('month_12','Costanza d''Acciaio','12 allenamenti in 30 giorni','⚙️',350,'rare'),
  ('weekend_warrior','Guerriero del Weekend','Allenati di sabato o domenica','🎉',60,'common'),
  ('early_bird','Alba di Ferro','Allenati tra le 4 e le 7 del mattino','🌅',100,'rare'),
  ('night_owl','Gufo Notturno','Allenati dopo le 21 o di notte','🦉',100,'rare'),
  ('marathon','Maratoneta','Sessione da almeno 90 minuti','⏳',200,'rare'),
  ('hours_10','Dieci Ore','10 ore totali di allenamento','🕰️',250,'rare'),
  ('hours_50','Cinquanta Ore','50 ore totali di allenamento','⌛',900,'epic'),
  ('big_session','Quest Epica','6 o più esercizi in un solo workout','📚',120,'common'),
  ('variety_10','Sperimentatore','Prova 10 esercizi diversi','🧪',120,'common'),
  ('variety_25','Enciclopedia','Prova 25 esercizi diversi','📖',400,'epic'),
  ('all_rounder','Completo','Allena 6 gruppi muscolari diversi','🎯',250,'rare'),
  ('sets_100','Cento Serie','Completa 100 serie totali','💯',200,'rare'),
  ('sets_500','Cinquecento Serie','Completa 500 serie totali','🔱',700,'epic'),
  ('heavy_100','Club dei 100','Solleva 100 kg o più in una serie','🏋️',300,'rare'),
  ('calisthenics_master','Maestro del Corpo Libero','Registra Planche, Front/Back Lever, Human Flag o Muscle-Up','🤸',500,'legendary'),
  ('first_routine','Stratega','Crea la tua prima routine','📋',60,'common'),
  ('first_program','Pianificatore','Crea il tuo primo programma','🗺️',80,'common'),
  ('custom_exercise','Inventore','Aggiungi un esercizio personalizzato','✏️',60,'common'),
  ('favorites_5','Collezionista','Salva 5 esercizi tra i preferiti','⭐',60,'common'),
  ('measurements_30','Diario Corporeo','Registra 30 misurazioni','📔',500,'epic');
