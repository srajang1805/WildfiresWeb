# Docker & Free-Tier Deployment Audit Report

**Project:** Wildfires India Platform  
**Audit Date:** July 2026  
**Auditor:** Senior DevOps Engineering Review  

---

## 1. Executive Summary

The Wildfires India platform is a **Next.js 16 + FastAPI + ML engine** application with no existing Docker configuration. The project is structured as a monorepo with three major components (frontend, backend, ML engine). It currently runs locally on Windows via two separate terminal processes (`npm run dev` + `uvicorn`).

**Overall Verdict:** The codebase is Docker-ready in principle but requires creating Dockerfiles, docker-compose.yml, .dockerignore, environment variable management, and production-grade configuration from scratch. Free-tier deployment is feasible with Render/Railway for the backend and Vercel for the frontend.

---

## 2. Scores

| Category | Score | Notes |
|----------|-------|-------|
| Docker Readiness | **2/10** | No Dockerfiles, compose, or .dockerignore exist |
| Free-Tier Readiness | **6/10** | Frontend deployable on Vercel; backend needs work |
| Production Readiness | **4/10** | Health endpoints exist; no HTTPS, secrets, or rate limiting |

---

## 3. Component Analysis

### 3.1 Frontend (Next.js 16 + React 19)

| Property | Value |
|----------|-------|
| Framework | Next.js 16.2.10 (Turbopack) |
| Runtime | Node.js |
| Build output | Static + SSR |
| Source size | ~1.5MB |
| node_modules | 842MB (dev) |
| Dependencies | 22 packages |
| Port | 3000 (dev) |

**Issues:**
- **CRITICAL**: `hardcoded localhost:8001` in 5+ source files (`MapView.tsx`, `ActiveFireLayer.tsx`, `TopRisksPanel.tsx`, `Chatbot.tsx`, `InsightsPanel.tsx`, model-explanation page). All API calls use `http://localhost:8001` directly.
- **HIGH**: No `.env` or `next.config.js` for API base URL
- **MEDIUM**: `next.config.ts` was deleted — no production build configuration
- **MEDIUM**: Next.js 16 uses Turbopack; ensure it's production-stable

### 3.2 Backend (FastAPI + Uvicorn)

| Property | Value |
|----------|-------|
| Framework | FastAPI (latest) |
| Server | Uvicorn |
| Dependencies | 10 Python packages |
| Port | 8001 (hardcoded) |
| Workers | 1 (dev mode) |
| Health check | `/health` (200 OK) |

**Issues:**
- **CRITICAL**: No WSGI/ASGI production server configuration (Gunicorn)
- **HIGH**: `sys.path.insert(0, ...)` hack for module resolution — fragile for Docker
- **HIGH**: In-memory tile cache (256-1024 entries) — not shared across workers
- **MEDIUM**: CORS hardcoded to `localhost:3000`
- **MEDIUM**: Background threads for heatmap + FIRMS renewal — no supervision

### 3.3 ML Engine (wildfire_engine)

| Property | Value |
|----------|-------|
| Model file | `models/production_model.pkl` (156KB) |
| Model type | XGBoost |
| Features | 21 features |
| FAISS index | `backend/rag/index/` (metadata.pkl 7KB) |
| Embeddings model | `all-MiniLM-L6-v2` (~90MB download) |

**Issues:**
- **HIGH**: `all-MiniLM-L6-v2` downloads ~90MB on first run — cold start bottleneck
- **MEDIUM**: `sentence-transformers` + `scipy` are heavy dependencies (~500MB+ installed)

---

## 4. Docker Findings

### 4.1 Missing Artifacts

| Artifact | Status | Severity |
|----------|--------|----------|
| Dockerfile (frontend) | ❌ Not found | CRITICAL |
| Dockerfile (backend) | ❌ Not found | CRITICAL |
| docker-compose.yml | ❌ Not found | CRITICAL |
| .dockerignore | ❌ Not found | HIGH |

### 4.2 Recommended Dockerfiles

**Frontend (multi-stage):**
```
Stage 1: node:20-alpine → npm ci → npm run build
Stage 2: node:20-alpine → copy .next/static + public → npm start
Estimated image: ~200MB
```

**Backend (single-stage):**
```
Base: python:3.11-slim
Install: fastapi, uvicorn, numpy, joblib, requests, shapely, mercantile, scipy, pillow, sentence-transformers, faiss-cpu
Copy: wildfire_engine/, backend/, models/, data/
ENTRYPOINT: uvicorn backend.main:app --host 0.0.0.0 --port 8000
Estimated image: ~1.2GB (due to scipy + sentence-transformers)
```

### 4.3 Image Size Concerns

| Dependency | Approx Size |
|------------|-------------|
| scipy | ~200MB |
| sentence-transformers + torch | ~800MB |
| faiss-cpu | ~50MB |
| numpy | ~30MB |
| Base python:3.11-slim | ~150MB |
| **Total estimated** | **~1.2GB** |

---

## 5. Platform Compatibility Matrix

| Platform | Frontend | Backend | Notes |
|----------|----------|---------|-------|
| **Vercel** | ✅ Fully compatible | ❌ Not recommended | Next.js native; no long-running processes for backend |
| **Render** | ✅ Fully compatible | ⚠ Requires changes | Web service for backend ($7/mo free tier); static site for frontend |
| **Railway** | ✅ Fully compatible | ⚠ Requires changes | $5 credit; backend needs Dockerfile |
| **Fly.io** | ✅ Fully compatible | ⚠ Requires changes | 3 shared VMs free; good for backend |
| **MongoDB Atlas** | N/A | N/A | Not used (no database) |
| **Supabase** | N/A | N/A | Not used |
| **Neon** | N/A | N/A | Not used (no PostgreSQL) |

### Recommended Architecture

```
Vercel (Free)           Render (Free) or Railway ($5 credit)
┌─────────────┐        ┌──────────────────────────┐
│  Next.js     │  API   │  FastAPI + ML Engine     │
│  Static SSR  │───────▶│  Port 8000               │
│  CDN cached  │        │  512MB RAM (min)         │
└─────────────┘        │  Cold start: ~30s         │
                       └──────────────────────────┘
```

---

## 6. Resource Estimates

| Resource | Estimated | Measured |
|----------|-----------|----------|
| Frontend bundle (gzipped) | ~150KB | Not measured |
| Frontend SSR memory | ~128MB | Not measured |
| Backend idle memory | ~400MB | Not measured |
| Backend peak memory (with ML) | ~800MB | Not measured |
| Model file size | 156KB | ✅ 156,219 bytes (measured) |
| FAISS index size | 7KB | ✅ 7,237 bytes (measured) |
| Embeddings model download | ~90MB | Not measured (first run) |
| Cold start (first request) | ~30-60s | Not measured |
| Disk usage (backend) | ~1.5GB | Not measured |

> ⚠ **Critical:** Backend memory may exceed free-tier limits (>512MB) due to `sentence-transformers` + `scipy`.

---

## 7. Security Findings

| Issue | Severity | File(s) |
|-------|----------|---------|
| FIRMS API key in env only | MEDIUM | `backend/services/firms.py` |
| No rate limiting | MEDIUM | `backend/main.py` |
| No HTTPS enforcement | HIGH | All files |
| CORS allows localhost only | MEDIUM | `backend/main.py:28` |
| No authentication | MEDIUM | All APIs are public |
| No request size limits | LOW | FastAPI defaults |

---

## 8. Production Readiness Checklist

| Item | Status |
|------|--------|
| Health check endpoint | ✅ `/health` |
| Graceful shutdown | ❌ Missing |
| Request timeout | ❌ Not configured |
| Rate limiting | ❌ Not configured |
| HTTPS/TLS | ❌ Not configured |
| Environment variables | ⚠ Only `FIRMS_API_KEY` |
| Logging | ⚠ `logging.basicConfig()` only |
| Error handling | ⚠ Try/catch in routes |
| Secrets management | ❌ None |
| Monitoring | ❌ None |
| Backups | ❌ None |
| CI/CD | ❌ None |
| Docker | ❌ None |

---

## 9. Critical Issues

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | **No Docker configuration** | CRITICAL | Cannot deploy |
| 2 | **Hardcoded localhost:8001 in 7 frontend files** | CRITICAL | Frontend won't work in production |
| 3 | **No Gunicorn/WSGI server** | HIGH | Uvicorn single-worker in prod |
| 4 | **sentence-transformers + scipy = ~1GB image** | HIGH | Exceeds free-tier memory limits |
| 5 | **In-memory cache not shared across workers** | MEDIUM | Tile regeneration per worker |
| 6 | **No .dockerignore** | MEDIUM | Will copy node_modules (842MB) |

---

## 10. Recommended Fixes (Priority Order)

### Priority 1 — Unblock Deployment
1. Create `.env` file with `NEXT_PUBLIC_API_URL`
2. Replace all `localhost:8001` with `process.env.NEXT_PUBLIC_API_URL`
3. Create `Dockerfile.backend` and `Dockerfile.frontend`
4. Create `docker-compose.yml`
5. Create `.dockerignore`

### Priority 2 — Reduce Image Size
1. Use `python:3.11-slim` base image
2. Install `scipy` with `--no-deps` and only needed subpackages
3. Consider replacing `sentence-transformers` with `onnxruntime` for inference-only
4. Use multi-stage build for frontend

### Priority 3 — Production Hardening
1. Add Gunicorn with 2-4 Uvicorn workers
2. Add rate limiting (slowapi or similar)
3. Make CORS origins configurable
4. Add request timeout middleware
5. Add graceful shutdown handlers

### Priority 4 — Observability
1. Structured logging (JSON format)
2. Health check for model loading status
3. Metrics endpoint (Prometheus)

---

## 11. Deployment Checklist

- [ ] Create `.env` for frontend with `NEXT_PUBLIC_API_URL`
- [ ] Create `.env` for backend with `FIRMS_API_KEY`
- [ ] Replace all hardcoded URLs with env vars
- [ ] Create `Dockerfile.frontend` (multi-stage, alpine)
- [ ] Create `Dockerfile.backend` (python:3.11-slim)
- [ ] Create `docker-compose.yml` with both services
- [ ] Create `.dockerignore` (exclude node_modules, .next, __pycache__)
- [ ] Add `HEALTHCHECK` to Dockerfiles
- [ ] Test `docker compose up --build`
- [ ] Deploy frontend to Vercel (free)
- [ ] Deploy backend to Render/Railway (free tier)
- [ ] Verify CORS works with production URLs
- [ ] Monitor cold start time (< 60s target)
- [ ] Verify tile generation works after restart

---

## 12. Final Verdict

**The project CAN be deployed on free-tier infrastructure** with approximately **4-6 hours of DevOps work**. The main blockers are the missing Docker configuration and hardcoded API URLs. The backend image will be large (~1GB) due to ML dependencies, which may push it beyond free-tier memory limits on some platforms. Consider Render's free tier (512MB with 750hrs/month) or Railway ($5 credit) as the most viable options.

**Risk Level: MEDIUM** — Deployable with modest effort. Monitor memory usage closely on free tier.
