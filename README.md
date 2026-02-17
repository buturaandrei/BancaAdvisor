# BancaAdvisor — Consulente Mutui con AI

Un'applicazione completa per gestire, confrontare e analizzare offerte di mutuo da diverse banche, con un consulente AI integrato basato su **Gemma 2B** (via Ollama).

## Architettura

```
BancaAdvisor/
├── backend/              # FastAPI + SQLite
│   ├── main.py           # Entry point API
│   ├── database.py       # SQLite async database
│   ├── models.py         # Pydantic schemas
│   ├── mortgage_engine.py # Motore di calcolo mutui
│   ├── ollama_advisor.py # Integrazione Gemma 2B
│   └── routes/           # API routes
│       ├── mutui.py      # CRUD mutui
│       ├── confronto.py  # Confronto mutui
│       └── advisor.py    # Consulente AI
└── frontend/             # React + Vite + TypeScript + Tailwind
    └── src/
        ├── components/   # UI components
        ├── api/          # API client
        ├── types/        # TypeScript types
        └── utils/        # Utilities
```

## Funzionalità

- **Gestione Mutui**: Inserisci e gestisci offerte da diverse banche
- **Smart Import**: Incolla testo da siti bancari, i dati vengono estratti automaticamente
- **Calcolo Automatico**: Rata mensile, piano ammortamento, costo totale, LTV, punteggio
- **Confronto**: Confronto side-by-side con grafici radar, barre e tabelle
- **AI Advisor**: Consulenza finanziaria da Gemma 2B via Ollama con analisi per scenari
- **Eurirs/Spread**: Inserisci l'Eurirs 30Y e lo spread viene calcolato per ogni mutuo fisso
- **Punteggio**: Sistema di scoring 0-100 per classificare le offerte
- **Stampa Report**: Report PDF comparativo stampabile
- **Grafici**: Ammortamento, debito residuo, composizione costi

## Prerequisiti

- **Python 3.11+**
- **Node.js 18+**
- **Ollama** con modello `gemma2:2b`

## Setup Rapido

### 1. Ollama (AI Advisor)

```bash
# Installa Ollama da https://ollama.com
ollama pull gemma2:2b
ollama serve    # Deve rimanere attivo
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'app sarà disponibile su **http://localhost:5173**

## Database

Il database è SQLite (`backend/bancadvisor.db`), creato automaticamente al primo avvio. È un file singolo che può essere:
- Copiato su qualsiasi cloud storage (Google Drive, Dropbox, OneDrive)
- Backuppato con un semplice copy
- Condiviso tra dispositivi

## API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/mutui/` | Lista tutti i mutui |
| POST | `/api/mutui/` | Crea nuovo mutuo |
| GET | `/api/mutui/{id}` | Dettaglio mutuo |
| PUT | `/api/mutui/{id}` | Aggiorna mutuo |
| DELETE | `/api/mutui/{id}` | Elimina mutuo |
| GET | `/api/mutui/{id}/ammortamento` | Piano ammortamento |
| POST | `/api/confronto/` | Confronta mutui |
| GET | `/api/advisor/status` | Stato Ollama/Gemma |
| POST | `/api/advisor/consulenza` | Chiedi consulenza AI |
| GET | `/api/advisor/storico` | Storico consulenze |

## Sistema di Punteggio

Il punteggio (0-100) considera:
- **TAN** (25%): Più basso = meglio
- **TAEG vs TAN** (20%): Differenza minore = meglio
- **LTV** (10%): Sotto 80% = ottimo
- **Spese accessorie** (5%): Rapporto spese/importo
- **Costo totale**: Calcolato automaticamente

## Tech Stack

- **Backend**: Python, FastAPI, aiosqlite, httpx
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons
- **AI**: Ollama + Gemma 2B
- **Database**: SQLite (WAL mode)

## Avvio Rapido su Windows

Per avviare rapidamente l'applicazione su Windows, utilizza il file `start.bat` presente nella cartella principale del progetto. Questo file eseguirà automaticamente i comandi necessari per avviare sia il backend che il frontend. Assicurati di avere installato tutte le dipendenze richieste e che i percorsi nei file di configurazione siano corretti.
