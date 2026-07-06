# Deployment Guide — Wildfires India

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker (optional, for containerized deployment)
- Vercel account (frontend)
- Render account (backend)
- NASA FIRMS API key (free at https://firms.modaps.eosdis.nasa.gov/api/)

---

## Environment Variables

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=https://wildfires-india-api.onrender.com
```

### Backend (`.env`)

```
PORT=8000
ALLOWED_ORIGINS=https://wildfires-india.vercel.app
FIRMS_API_KEY=your_nasa_firms_key
```

---

## Local Development

### Backend

```bash
pip install -r backend/requirements.txt
pip install sentence-transformers faiss-cpu xgboost scikit-learn
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker compose up --build
```

Frontend: http://localhost:3000  
Backend: http://localhost:8000

---

## Vercel Deployment (Frontend)

1. Push repository to GitHub
2. Import project in Vercel
3. Framework: Next.js
4. Root Directory: `frontend`
5. Add environment variable: `NEXT_PUBLIC_API_URL` = your Render backend URL
6. Deploy

---

## Render Deployment (Backend)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Root Directory: (leave blank — project root)
4. Build Command: `pip install -r backend/requirements.txt && pip install sentence-transformers faiss-cpu xgboost scikit-learn`
5. Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `PYTHONPATH` = `/opt/render/project/src`
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app`
   - `FIRMS_API_KEY` = your NASA FIRMS key
7. Plan: Free (512MB RAM, 750hrs/month)
8. Deploy

---

## Production Checklist

- [ ] `FIRMS_API_KEY` set in Render
- [ ] `ALLOWED_ORIGINS` matches Vercel domain
- [ ] `NEXT_PUBLIC_API_URL` matches Render URL
- [ ] Health endpoint returns 200
- [ ] CORS allows frontend origin
- [ ] Heatmap loads without errors
- [ ] Prediction API responds
- [ ] Active fires load (if FIRMS key set)
- [ ] Chatbot works
- [ ] Build passes with no errors

---

## Troubleshooting

**"Failed to fetch" errors**: Check `NEXT_PUBLIC_API_URL` matches the Render backend URL exactly.

**Blank map**: Verify CORS origins include the frontend domain.

**No active fires**: Set `FIRMS_API_KEY` environment variable on Render.

**Cold start slow**: First request triggers model download (~90MB). Allow 30-60s for first response.

**Memory exceeded**: Free tier is 512MB. If the app exceeds this, try reducing workers to 1.
