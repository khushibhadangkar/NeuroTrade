# NeuroTrade OS

**AI-Powered Indian Market Intelligence Terminal**

An institutional-grade platform for NIFTY, BANKNIFTY, and Indian equity forecasting using LSTM neural networks. Probabilistic scenario analysis, technical intelligence, and cinematic visualization.

## Quick Start

```bash
# Install dependencies
npm run setup

# Run both frontend + backend
npm run dev
```

- **Frontend:** http://localhost:3010
- **Backend:** http://localhost:5001

## What It Does

- **LSTM Forecasting** — Trains a 128→64→32→1 neural network on live NSE/BSE data via yfinance
- **Probabilistic Analysis** — Bullish/Bearish/Consolidation probability scenarios (not guaranteed outcomes)
- **Market Bias Intelligence** — Direction, volatility, momentum, and institutional flow assessment
- **Support & Resistance** — Pivot-based key levels with strength indicators
- **Technical Signals** — Moving averages, volume trends, directional accuracy
- **Multi-Index Comparison** — NIFTY vs BANKNIFTY vs FINNIFTY side-by-side

## Supported Instruments

| Type | Symbols |
|---|---|
| Indices | `^NSEI` (NIFTY), `^NSEBANK` (BANKNIFTY), `^BSESN` (SENSEX) |
| Banking | `HDFCBANK.NS`, `ICICIBANK.NS`, `SBIN.NS`, `KOTAKBANK.NS` |
| IT | `INFY.NS`, `TCS.NS`, `WIPRO.NS`, `HCLTECH.NS` |
| Energy | `RELIANCE.NS`, `ONGC.NS`, `NTPC.NS` |
| FMCG | `HINDUNILVR.NS`, `ITC.NS` |
| Auto | `MARUTI.NS`, `TATAMOTORS.NS` |

## Architecture

```
NeuroTrade OS/
├── neurotrade-os/          # Next.js 14 immersive frontend
├── core/                   # Shared config, logging, artifacts
├── data/                   # yfinance data fetching
├── model_training/         # LSTM pipeline (8 stages)
├── utils/                  # Technical analysis utilities
├── stock-prediction-frontend/api/  # Flask prediction API
├── deployment/             # Docker, Vercel, Railway configs
└── docs/                   # Architecture, API, deployment guides
```

## Tech Stack

**Frontend:** Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · React Three Fiber · Recharts · TanStack Query · Zustand

**Backend:** Flask · TensorFlow/Keras · scikit-learn · pandas · yfinance · NumPy

**Model:** Stacked LSTM (128→64→32→1) · Adam optimizer · Huber loss · 60-day sequence window · Early stopping

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel + Railway deployment instructions.

## Disclaimer

This platform generates probabilistic forecasts using machine learning models. Predictions are not guaranteed outcomes and should not be used as the sole basis for trading decisions. Always conduct your own research and consult a financial advisor.
