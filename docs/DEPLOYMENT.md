# NeuroTrade OS — Deployment Guide

## Architecture

```
┌──────────────┐     HTTPS      ┌──────────────────┐
│   Vercel     │ ──────────────▶│  Railway/Render  │
│  (Frontend)  │   API Proxy    │   (Backend)      │
│  Next.js 14  │ ◀──────────────│   Flask + LSTM   │
└──────────────┘                └──────────────────┘
```

## Frontend (Vercel)

### Setup

1. Connect your GitHub repo to Vercel
2. Set the root directory to `neurotrade-os/`
3. Framework preset: Next.js
4. Build command: `npm run build`
5. Output directory: `.next`

### Environment Variables (Vercel Dashboard)

```
NEUROTRADE_API_URL=https://your-backend.railway.app
```

### vercel.json

Already configured at `deployment/vercel.json`. Copy to `neurotrade-os/vercel.json` if deploying from subdirectory.

---

## Backend (Railway / Render)

### Railway

1. Connect repo → set root directory to project root
2. Start command: `cd stock-prediction-frontend/api && python app.py`
3. Or use the Procfile at `deployment/Procfile`

### Render

1. Create a new Web Service
2. Build command: `pip install -r stock-prediction-frontend/api/requirements.txt`
3. Start command: `cd stock-prediction-frontend/api && python app.py`

### Environment Variables

```
NEUROTRADE_HOST=0.0.0.0
NEUROTRADE_PORT=5001
NEUROTRADE_DEBUG=false
NEUROTRADE_LOG_JSON=true
NEUROTRADE_CORS_ORIGINS=https://your-frontend.vercel.app
NEUROTRADE_MAX_SYMBOLS=10
```

### Docker

```bash
docker build -f deployment/Dockerfile -t neurotrade-api .
docker run -p 5001:5001 --env-file .env neurotrade-api
```

---

## Local Development

```bash
# Install everything
npm run setup

# Run both servers concurrently
npm run dev

# Or run separately:
npm run dev:frontend   # http://localhost:3010
npm run dev:backend    # http://localhost:5001
```

---

## Production Checklist

- [ ] Set `NEUROTRADE_DEBUG=false`
- [ ] Set `NEUROTRADE_CORS_ORIGINS` to your frontend domain only
- [ ] Set `NEUROTRADE_API_URL` in Vercel to your backend URL
- [ ] Verify `/health` returns 200 from the deployed backend
- [ ] Test a prediction end-to-end
- [ ] Monitor logs for errors (structured JSON format)
