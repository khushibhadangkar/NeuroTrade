# NeuroTrade OS — Architecture

## Project Structure

```
neurotrade-os/                  # Next.js 14 frontend (TypeScript, Tailwind, Three.js)
stock-prediction-frontend/api/  # Flask backend (Python, yfinance, LSTM)
core/                           # Shared Python core (config, logging, errors)
model_training/                 # LSTM model training pipeline
data/                           # Data fetching module (yfinance)
utils/                          # Python utilities (trend signals, visualization)
scripts/                        # CLI entry point
deployment/                     # Docker, Procfile, Vercel config
docs/                           # Documentation
```

## Frontend (`neurotrade-os/src/`)

**Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, Three.js, Zustand, TanStack Query

### Routes
| Route | Purpose |
|-------|---------|
| `/` | Redirect to `/landing` |
| `/landing` | Marketing landing page |
| `/os/home` | Market Intelligence Home |
| `/os/forecast` | Universal AI Forecast Engine |
| `/os/commodities` | Macro Intelligence Terminal |
| `/os/watchlist` | Personalized Asset Watchlist |
| `/os/compare` | Side-by-Side Comparison |

### Key Directories
```
src/
├── app/              # Next.js App Router pages
├── components/
│   ├── charts/       # Candlestick, forecast, MACD, RSI charts
│   ├── dashboard/    # AI insights panel, trading dashboard
│   ├── forecast/     # Universal forecast result, symbol search
│   ├── landing/      # Landing page components
│   ├── loading/      # Cinematic loading sequence
│   ├── shell/        # OS shell (sidebar, topbar, ambient bg)
│   ├── three/        # Three.js 3D scene components
│   ├── ui/           # Shared UI primitives
│   └── workspaces/   # Workspace page components
├── hooks/            # React Query hooks for data fetching
├── lib/              # Utilities (finance, motion, tokens)
├── services/         # API service layer (forecast, market)
├── store/            # Zustand global state
└── types/            # TypeScript type definitions
```

### Data Flow
```
Backend API → services/ → hooks/ (React Query) → components/workspaces/
```

All market data flows through:
1. `services/forecast.ts` — Universal forecast endpoint
2. `services/market.ts` — Market overview, indices, commodities, technicals
3. `services/api.ts` — Legacy predict endpoint (LSTM)

## Backend (`stock-prediction-frontend/api/`)

**Framework:** Flask, yfinance, NumPy, Pandas, scikit-learn, TensorFlow/Keras

### Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/predict` | LSTM prediction (legacy) |
| GET | `/forecast/<symbol>` | Universal AI forecast |
| GET | `/market/overview` | Full market overview |
| GET | `/market/indices` | Indian index quotes |
| GET | `/market/equities` | Equity quotes |
| GET | `/market/commodities` | Commodity prices |
| GET | `/market/technicals/<symbol>` | Technical analysis |
| GET | `/market/quote/<symbol>` | Single quote |

### Key Modules
| File | Purpose |
|------|---------|
| `app.py` | Flask routes and middleware |
| `services.py` | LSTM prediction orchestration |
| `forecast_engine.py` | Universal forecast (technicals + narrative) |
| `market_data.py` | Real-time data via yfinance |
| `technicals.py` | RSI, MACD, EMA, ATR, Bollinger computation |

## Running

```bash
npm run dev          # Starts both frontend (port 3010) and backend (port 5001)
npm run dev:frontend # Frontend only
npm run dev:backend  # Backend only
```

## Design Principles

- **Real data only** — no mock/placeholder intelligence
- **Probabilistic, not deterministic** — probabilities, not guarantees
- **Asset-aware** — adapts narrative for indices, equities, commodities
- **Indian market focus** — NSE/BSE symbols, INR formatting, IST timezone
- **Cinematic UI** — dark institutional aesthetic, glassmorphism, motion design
