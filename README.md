# ⚔️ FitQuest v2.0 — Guida Deploy su Cloudflare

Architettura:
- **Cloudflare Pages** → Frontend React (gratis, illimitato)
- **Cloudflare Workers** → Backend API (gratis, 100k req/giorno)
- **Cloudflare D1** → Database SQLite (gratis, 5GB)

---

## Prerequisiti

- Account Cloudflare gratuito → cloudflare.com
- Node.js installato
- Git installato

---

## STEP 1 — Crea account Cloudflare

1. Vai su **cloudflare.com** → "Sign Up"
2. Inserisci email e password
3. Verifica l'email
4. NON serve aggiungere un dominio — il piano gratuito funziona senza

---

## STEP 2 — Installa Wrangler (tool Cloudflare)

Apri il terminale e scrivi:

```
npm install -g wrangler
```

Poi fai il login:

```
wrangler login
```

Si aprirà il browser — autorizza l'accesso. Quando vedi "Successfully logged in" nel terminale sei a posto.

---

## STEP 3 — Crea il database D1

```
wrangler d1 create fitquest-db
```

Vedrai un output tipo:
```
✅ Successfully created DB 'fitquest-db'
[[d1_databases]]
binding = "DB"
database_name = "fitquest-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copia il `database_id`** — ti serve dopo.

---

## STEP 4 — Configura il Worker

1. Apri il file `worker/wrangler.toml`
2. Sostituisci `YOUR_DATABASE_ID_HERE` con il tuo ID copiato sopra

---

## STEP 5 — Crea le tabelle nel database

Entra nella cartella worker:
```
cd worker
npm install
```

Poi esegui la migrazione:
```
wrangler d1 execute fitquest-db --file=./schema.sql
```

Dovresti vedere tante righe "ok" — le tabelle sono create con tutti gli esercizi già inseriti.

---

## STEP 6 — Deploy del Worker (backend API)

Ancora nella cartella `worker`:
```
wrangler deploy
```

Vedrai il tuo URL del worker, tipo:
```
https://fitquest-worker.TUO-NOME.workers.dev
```

**Salvati questo URL** — ti serve nel prossimo step.

---

## STEP 7 — Configura il frontend

Apri il file `frontend/vite.config.ts` e aggiorna il proxy con il tuo URL worker:

```ts
proxy: {
  '/api': {
    target: 'https://fitquest-worker.TUO-NOME.workers.dev',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/api')
  }
}
```

**ATTENZIONE**: Per Cloudflare Pages in produzione devi usare un file
`frontend/public/_redirects` (già incluso) e impostare la variabile
d'ambiente `VITE_API_URL` nelle impostazioni di Pages.

In alternativa più semplice: modifica `frontend/src/lib/api.ts` e
cambia la riga:
```ts
const BASE = '/api';
```
con:
```ts
const BASE = 'https://fitquest-worker.TUO-NOME.workers.dev/api';
```

---

## STEP 8 — Build del frontend

Entra nella cartella frontend:
```
cd ../frontend
npm install
npm run build
```

Verrà creata la cartella `dist/` con il sito compilato.

---

## STEP 9 — Deploy su Cloudflare Pages

**Opzione A — Da browser (più semplice):**

1. Vai su **dash.cloudflare.com**
2. Clicca **"Workers & Pages"** → **"Create"** → **"Pages"**
3. Clicca **"Upload assets"**
4. Carica tutta la cartella `frontend/dist/`
5. Clicca **"Deploy site"**

Il sito sarà live su: `https://fitquest.pages.dev`

**Opzione B — Da terminale:**

```
npx wrangler pages deploy dist --project-name=fitquest
```

---

## STEP 10 — Testa il sito

Apri il browser su `https://fitquest.pages.dev` e registrati!

---

## Struttura del progetto

```
fitquest-v2/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css       # Tema dark/light
│   │   ├── components/
│   │   │   └── Sidebar.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts  # JWT auth
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── pages/
│   │       ├── AuthPage.tsx
│   │       ├── Dashboard.tsx
│   │       ├── LogWorkout.tsx
│   │       ├── Routines.tsx
│   │       ├── Programs.tsx
│   │       ├── History.tsx
│   │       ├── Achievements.tsx
│   │       ├── BodyTracker.tsx    ← NUOVO v2.0
│   │       ├── ExerciseStats.tsx  ← NUOVO v2.0
│   │       └── Profile.tsx
│   ├── public/
│   │   └── _redirects
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
└── worker/                 # Cloudflare Worker API
    ├── src/
    │   └── index.js        # API completa con JWT
    ├── schema.sql           # DB schema + seed
    ├── wrangler.toml        # Config (metti il tuo DB ID)
    └── package.json
```

---

## Nuove funzionalità v2.0

- 🌙☀️ **Tema scuro/chiaro** — toggle nell'header della sidebar
- 📏 **Body Tracker** — traccia peso e calcola BMI con grafico
- 📊 **Statistiche Esercizi** — vedi la progressione dei pesi per ogni esercizio
- 🔐 **Auth JWT** — token sicuro, niente sessioni server

---

## Problemi comuni

**"wrangler: command not found"**
```
npm install -g wrangler
```

**Errore CORS nel browser**
Nel worker `src/index.js` i CORS sono già configurati con `Access-Control-Allow-Origin: *`

**Il sito carica ma le API non rispondono**
Controlla che il URL del worker in `api.ts` sia corretto.

**Database vuoto dopo il deploy**
Riesegui: `wrangler d1 execute fitquest-db --file=./schema.sql`

---

## Contatti

Parisi Alessandro — djpj8.09@gmail.com
