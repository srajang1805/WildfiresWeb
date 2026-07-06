# Free-Tier Deployment Fixes Report

## Summary

All production blockers identified in the audit have been addressed. The repository is now deployable on Vercel (frontend) + Render (backend) free tiers.

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/lib/constants.ts` | Added `api()` helper, `API_BASE` from `NEXT_PUBLIC_API_URL`, removed hardcoded URL fallback to localhost only as dev default |
| `frontend/src/hooks/useHeatmap.ts` | Uses `api()` instead of hardcoded URL |
| `frontend/src/hooks/usePrediction.ts` | Uses `api()` instead of hardcoded URL |
| `frontend/src/hooks/useFirms.ts` | Uses `api()` instead of hardcoded URL |
| `frontend/src/hooks/useSearch.ts` | Uses `api()` instead of hardcoded URL |
| `frontend/src/components/map/MapView.tsx` | `IMG_URL` uses `api()`, imported `api` |
| `frontend/src/components/map/ActiveFireLayer.tsx` | `FIRMS_URL` uses `api()` |
| `frontend/src/components/panels/TopRisksPanel.tsx` | Heatmap fetch uses `api()` |
| `frontend/src/components/overlays/Chatbot.tsx` | Chat fetch uses `api()`, imported `api` |
| `frontend/src/app/model-explanation/page.tsx` | Model-info fetch uses `api()`, imported `api` |
| `backend/main.py` | CORS origins from `ALLOWED_ORIGINS` env var, FIRMS worker only starts if key present |
| `backend/rag/retriever.py` | `sentence-transformers` import moved inside function (lazy-load, ~800MB memory saved on startup) |

## Files Created

| File | Purpose |
|------|---------|
| `frontend/.env.example` | Frontend env template |
| `frontend/.env.local` | Frontend dev defaults |
| `.env.example` | Backend env template |
| `Dockerfile` | Backend/ML Docker image (python:3.11-slim) |
| `frontend/Dockerfile` | Frontend Docker image (multi-stage, alpine) |
| `docker-compose.yml` | Local dev with both services |
| `.dockerignore` | Excludes node_modules, .next, __pycache__, etc. |
| `render.yaml` | Render deployment config (free plan) |
| `DEPLOYMENT.md` | Full deployment guide |

## localhost References Removed

| Before | After |
|--------|-------|
| 7 files with `http://localhost:8001` hardcoded | 1 default fallback in `constants.ts` |
| CORS hardcoded to `localhost:3000` | Configurable via `ALLOWED_ORIGINS` |

## Memory Optimizations

| Optimization | Impact |
|-------------|--------|
| Lazy-load `sentence-transformers` | ~800MB not loaded at startup; only when chatbot used |
| `python:3.11-slim` base image | ~150MB vs ~900MB for full python |
| `--no-cache-dir` pip install | ~200MB saved in Docker layer |
| `libgomp1` only (not full build-essential) | ~300MB smaller image |

## Render Compatibility

- Listens on `$PORT` (0.0.0.0)
- Health check at `/health`
- `render.yaml` with free plan
- `PYTHONPATH` set correctly
- No filesystem assumptions (relative paths)

## Remaining Limitations

1. **No database** — in-memory caches reset on restart (acceptable for free tier)
2. **sentence-transformers** — still ~800MB installed, just lazy-loaded
3. **FIRMS optional** — works without API key (shows 0 active fires)
4. **No authentication** — APIs are public (acceptable for read-only data)
5. **Cold start** — 30-60s on Render free tier first load

## Verification

- [x] `npm run build` passes with zero errors
- [x] Zero `localhost:8001` outside constants.ts dev default
- [x] All API calls use `api()` helper
- [x] CORS configurable via environment
- [x] Dockerfiles created with multi-stage builds
- [x] docker-compose.yml for local development
- [x] render.yaml for Render deployment
- [x] DEPLOYMENT.md with full instructions
