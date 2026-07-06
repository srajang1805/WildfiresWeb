# Render Free Tier Deployment Audit

**Project:** Wildfires India  
**Auditor:** Senior DevOps Engineer  
**Date:** July 2026  

---

## Executive Summary

The repository is **close to Render-ready** but requires 2 critical fixes:

1. **CRITICAL**: Dockerfile hardcodes port 8000 — must use `$PORT` from Render  
2. **CRITICAL**: render.yaml uses native Python — must switch to Docker for import compatibility  

After these fixes, the project is deployable on Render Free Tier (512MB RAM, 750hrs/month).

---

## 1. Deployment Type Recommendation

**Recommended: Render Docker Web Service (`type: web`, `env: docker`)**

| Option | Viable? | Reason |
|--------|---------|--------|
| Native Python | ❌ No | Package named `wildfire_engine` requires special PYTHONPATH; Render's `src/` directory breaks imports |
| Docker Web Service | ✅ Yes | Dockerfile handles all dependencies and paths correctly |
| Background Worker | ❌ No | This is a web API |
| Static Site | ❌ No | API server, not static |

---

## 2. Project Structure Audit

| File | Status | Notes |
|------|--------|-------|
| `render.yaml` | ⚠ Needs fix | Uses `env: python` — should be `env: docker` |
| `Dockerfile` | ⚠ Needs fix | Port 8000 hardcoded — use `$PORT` |
| `docker-compose.yml` | ✅ OK | Local dev only |
| `requirements.txt` | ✅ OK | 10 packages, all pinned |
| `.env.example` | ✅ OK | Clean defaults |
| `Procfile` | ❌ Missing | Not needed for Docker |

---

## 3. Exact Render Dashboard Settings

```
Service Type:    Web Service
Environment:     Docker
Name:            wildfires-india-api
Region:          Oregon (us-west)
Branch:          main
Root Directory:  (leave blank — project root)
Dockerfile Path: ./Dockerfile
Auto Deploy:     Yes
Plan:            Free
```

---

## 4. Required Environment Variables

| Name | Required | Default | Description | Example |
|------|----------|---------|-------------|---------|
| `PORT` | No | Render auto | Render sets this automatically | `10000` |
| `ALLOWED_ORIGINS` | Yes | — | CORS origins (comma-separated) | `https://wildfires-india.vercel.app` |
| `FIRMS_API_KEY` | No | `""` | NASA FIRMS key | `ddd2b8a0e248...` |
| `PYTHONPATH` | No | Set in Dockerfile | Python path | `/app` |

---

## 5. Port Configuration

| Check | Status |
|-------|--------|
| Binds to `$PORT` | ❌ **FAIL** — hardcoded 8000 in CMD |
| Binds to `0.0.0.0` | ✅ Yes (`--host 0.0.0.0`) |
| No localhost binding | ✅ Yes |
| EXPOSE directive | ⚠ 8000 (informational only) |

**Fix required:**
```dockerfile
# Before
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

# After
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

---

## 6. Health Check

| Check | Status |
|-------|--------|
| Endpoint exists | ✅ `GET /health` |
| Returns 200 | ✅ `{"status":"ok"}` |
| Lightweight | ✅ No DB/model calls |
| Docker HEALTHCHECK | ⚠ Uses hardcoded port 8000 |

**Fix:** Remove Docker HEALTHCHECK (Render does its own) or make port dynamic.

---

## 7. Dependency Audit

| Dependency | Size | Build Time |
|-----------|------|-----------|
| fastapi + uvicorn + pydantic | ~5MB | ~5s |
| numpy + scipy + pillow | ~60MB | ~15s |
| shapely + mercantile | ~5MB | ~3s |
| torch (CPU) | ~200MB | ~30s |
| sentence-transformers | ~600MB | ~20s |
| faiss-cpu | ~20MB | ~3s |
| xgboost + scikit-learn | ~140MB | ~10s |
| **Total estimated** | **~1GB** | **~90s** |

**Risk:** sentence-transformers + torch CPU add ~800MB. Consider lazy-loading for Render free tier (already implemented — only loads on first chat query).

---

## 8. Persistent Storage

| Artifact | Ephemeral-safe? | Notes |
|----------|-----------------|-------|
| Model file (.pkl) | ✅ | Read from disk, no writes |
| FAISS index | ✅ | Read-only, small (7KB) |
| Tile cache | ✅ | In-memory only, resets on restart |
| Heatmap cache | ✅ | In-memory, regenerates on startup |
| Knowledge base JSON | ✅ | Read-only |

**Verdict:** ✅ Fully ephemeral-compatible. No persistent storage needed.

---

## 9. Runtime Memory

| Phase | Estimate | Free Tier Limit |
|-------|----------|-----------------|
| Idle (no requests) | ~250MB | 512MB ✅ |
| First request (model load) | ~400MB | 512MB ✅ |
| Chatbot first query | ~700MB | 512MB ⚠ |
| Steady state | ~350MB | 512MB ✅ |

**Risk:** First chatbot query loads sentence-transformers (~400MB extra). May briefly exceed 512MB. Monitor and consider disabling chatbot on free tier.

---

## 10. Cold Start Analysis

| Phase | Time |
|-------|------|
| Container start | ~5s |
| Python imports | ~3s |
| Model load (153KB) | ~1s |
| Heatmap generation (3565 pts) | ~3s |
| First prediction | ~8s total |
| Chatbot first query | +30s (downloads all-MiniLM-L6-v2) |

**Verdict:** Acceptable for free tier. First prediction <10s.

---

## 11. Network Configuration

| Check | Status |
|-------|--------|
| Open-Meteo (weather) | ✅ Public API, no auth |
| NASA FIRMS (fires) | ✅ Key-based, optional |
| OSM Tiles (map) | ✅ Browser loads directly |
| CORS | ✅ Configurable via `ALLOWED_ORIGINS` |
| HTTPS | ✅ Render provides TLS automatically |

---

## 12. Security Audit

| Check | Status |
|-------|--------|
| Secrets committed | ❌ FIRMS key in old code (hardcoded, now env-based) |
| .env committed | ✅ Not in repo (in .gitignore) |
| Wildcard CORS | ✅ No — uses explicit origins |
| Debug mode | ✅ Production (logging.INFO) |
| Non-root user | ✅ Dockerfile USER app |
| API keys exposed | ✅ FIRMS key only via env var |

**Warning:** Previous FIRMS key (`ddd2b8...`) was in git history. Rotate if needed.

---

## 13. Render Compatibility Scores

| Category | Score | Notes |
|----------|-------|-------|
| Configuration | 5/10 | render.yaml needs `env: docker` |
| Build | 8/10 | reqs complete, CPU torch, ~90s build |
| Runtime | 7/10 | Port fix needed, memory borderline |
| Networking | 9/10 | CORS configurable, HTTPS auto |
| Security | 8/10 | Non-root, env vars, no wildcards |
| Performance | 6/10 | 8s cold start, chatbot adds 30s |
| **Overall** | **7.2/10** | **Ready after 2 fixes** |

---

## 14. Critical Fixes Required

### Fix 1: Dockerfile — Dynamic Port
**File:** `Dockerfile` line 29  
**Severity:** CRITICAL  
**Change:**
```dockerfile
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

### Fix 2: render.yaml — Docker Environment
**File:** `render.yaml` line 4  
**Severity:** CRITICAL  
**Change:**
```yaml
env: docker
```

### Fix 3: docker-compose.yml — Port Consistency
**File:** `docker-compose.yml`  
**Severity:** LOW  
**Change:** Align health check port with Render's dynamic port.

---

## 15. Final Verdict

**⚠ This repository is NEARLY ready for Render Free Tier deployment.**

Two critical fixes required (Docker port + render.yaml env type). After applying these, the project will deploy successfully on Render's free tier with:
- 512MB RAM (sufficient for idle/steady state)
- ~90s build time
- ~8s cold start for predictions
- Automatic HTTPS via Render
- Zero persistent storage costs

**Recommended next steps:**
1. Apply the 2 critical fixes above
2. Push to GitHub (auto-deploys to Render)
3. Set `ALLOWED_ORIGINS` to Vercel frontend URL
4. (Optional) Set `FIRMS_API_KEY` for active fire data
5. Verify `/health` returns 200 from production URL
