import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.routers.heatmap import start_heatmap_worker
    from backend.services.firms import start_firms_worker

    start_heatmap_worker()
    start_firms_worker()
    yield


app = FastAPI(title="Wildfire Intelligence Platform", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routers.heatmap import router as heatmap_router
from backend.routers.predict import router as predict_router
from backend.routers.tile_route import router as tile_router
from backend.routers.firms_route import router as firms_router
from backend.routers.search import router as search_router

app.include_router(heatmap_router)
app.include_router(predict_router)
app.include_router(tile_router)
app.include_router(firms_router)
app.include_router(search_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "wildfire-intelligence-api"}
