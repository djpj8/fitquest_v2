# ⚔️ FitQuest v2.0

**Trasforma ogni allenamento in una quest.**

FitQuest è una web app fitness gamificata: registri i tuoi workout, guadagni punti esperienza (XP), sali di livello e sblocchi achievement, come in un gioco di ruolo. Pensata per chi si allena in palestra, a corpo libero o in entrambi i modi, e vuole tenere traccia dei progressi con un pizzico di motivazione in più.

---

## ✨ Cosa puoi fare

### 🎮 Progressione stile RPG
- **XP e livelli**: ogni allenamento completato ti dà esperienza. I livelli richiedono via via più XP (+50% a ogni livello), quindi salire diventa una sfida sempre più soddisfacente.
- **Classi personaggio**: scegli la tua classe alla registrazione.
  - ⚔️ **Warrior**: forza e potenza
  - 🔮 **Mage**: tecnica e disciplina
  - 🏹 **Ranger**: velocità e resistenza
- **Achievement**: 9 traguardi da sbloccare, con rarità diversa (comune, raro, epico, leggendario) e bonus XP, dal primo allenamento fino al titolo di *Mythic Legend* al livello 20.

### 🏋️ Allenamenti
- **Log Workout**: registra serie, ripetizioni e pesi per ogni esercizio, con durata e note. Alla fine ricevi un riepilogo "Quest Completata" con l'XP guadagnato.
- **Libreria di 59 esercizi** già pronta: 26 da palestra e 33 di calisthenics, divisi per gruppo muscolare (petto, schiena, gambe, spalle, braccia, core, cardio). Dal Bench Press al Muscle-Up, fino ai movimenti avanzati come Front Lever e Planche.
- **Esercizi personalizzati**: aggiungi i tuoi, con i muscoli coinvolti.
- **Preferiti**: segna gli esercizi che usi di più.
- **Routine**: crea schede riutilizzabili (es. *Push Day*) e avviale con un clic.
- **Programmi**: organizza le routine in piani più lunghi (es. *12 Settimane Forza*).

### 📊 Statistiche e progressi
- **Dashboard** con riepilogo del tuo profilo, XP settimanali e ultimi allenamenti.
- **Cronologia** completa di tutti i workout svolti.
- **Statistiche per esercizio**: grafico della progressione dei carichi nel tempo.
- **Body Tracker**: registra peso e altezza, calcola il **BMI** e visualizza l'andamento in un grafico.

### 🎨 Personalizzazione
- **Tema chiaro e scuro**, salvato sul tuo account.
- Gestione del profilo e possibilità di eliminare l'account con tutti i dati.

---

## ⚡ Come funziona il sistema XP

| Azione | XP |
|---|---|
| Completare un allenamento | **20** base |
| Durata dell'allenamento | **+0,5** per ogni minuto |
| Ogni serie registrata | **+10** |
| Sbloccare un achievement | bonus da **50 a 1000** |

Il fabbisogno di XP per il livello successivo cresce del 50% a ogni livello, partendo da 100 XP.

### 🏆 Achievement disponibili

| Icona | Nome | Obiettivo | Rarità |
|---|---|---|---|
| ⚔️ | First Blood | Completa il primo workout | Comune |
| 🛡️ | Seasoned Warrior | Completa 10 workout | Raro |
| 👑 | Legendary Champion | Completa 50 workout | Leggendario |
| ⚡ | Rising Power | Raggiungi il livello 5 | Comune |
| 🔥 | Elite Warrior | Raggiungi il livello 10 | Raro |
| 💎 | Mythic Legend | Raggiungi il livello 20 | Leggendario |
| 🏆 | Iron Will | Allenati 5 volte in una settimana | Epico |
| 📏 | Body Tracker | Registra la prima misurazione | Comune |
| 🎯 | Transformation | Registra 10 misurazioni | Raro |

---

## 🛠️ Tecnologie

Il progetto è interamente costruito sull'ecosistema **Cloudflare**, pensato per funzionare senza costi di hosting.

| Livello | Tecnologia |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Stile** | Tailwind CSS con tema personalizzato dark/light |
| **Dati e cache** | TanStack React Query |
| **Grafici** | Recharts |
| **Backend** | Cloudflare Workers (API REST) |
| **Database** | Cloudflare D1 (SQLite) |
| **Autenticazione** | Token firmato con Web Crypto |

---

## 🧱 Architettura

```
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│  Frontend (React)    │ ───▶ │  Worker (API REST)   │ ───▶ │  D1 (SQLite)     │
│  Sito statico        │ ◀─── │  Auth, XP, logica    │ ◀─── │  Utenti, workout │
└──────────────────────┘      └──────────────────────┘      └──────────────────┘
```

### Struttura del repository

```
fitquest-v2/
├── frontend/              # App React
│   └── src/
│       ├── pages/         # Dashboard, LogWorkout, Routines, Programs,
│       │                  # History, Achievements, BodyTracker,
│       │                  # ExerciseStats, Profile, AuthPage
│       ├── components/    # Sidebar
│       ├── hooks/         # useAuth
│       └── lib/           # client API e utility
└── worker/                # Backend
    ├── src/index.js       # API REST
    └── schema.sql         # Schema del database e dati iniziali
```

### Modello dati

Il database è composto da 9 tabelle: `users`, `exercises`, `favorite_exercises`, `routines`, `programs`, `workout_logs`, `body_measurements`, `achievements` e `user_achievements`.

### API principali

| Area | Endpoint |
|---|---|
| Autenticazione | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/theme`, `/auth/account` |
| Esercizi | `/exercises`, `/exercises/favorites`, `/exercises/:id/favorite` |
| Routine | `/routines`, `/routines/:id` |
| Programmi | `/programs`, `/programs/:id` |
| Workout | `/workouts`, `/workouts/stats`, `/workouts/exercise-stats` |
| Misurazioni | `/measurements`, `/measurements/:id` |
| Achievement | `/achievements` |

---

## 🗺️ Idee per il futuro

- Classifica tra amici e sfide settimanali
- Streak giornaliere con bonus XP
- Obiettivi personalizzati (peso, carichi, frequenza)
- Grafici di volume e records personali
- Versione installabile come app (PWA)

---

## 👤 Autore

**Parisi Alessandro**
📧 djpj8.09@gmail.com

---

<p align="center">Fatto con ⚔️ e tanta voglia di allenarsi.</p>
