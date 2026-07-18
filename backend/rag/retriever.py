import pickle
import logging
from pathlib import Path
import numpy as np
import faiss

logger = logging.getLogger(__name__)

INDEX_DIR = Path(__file__).parent / "index"
MODEL_NAME = "all-MiniLM-L6-v2"

_model = None
_index = None
_docs: list[dict] = []
_loaded = False


def _load():
    global _model, _index, _docs
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(MODEL_NAME)
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer model: {e}")
            return
    if _index is None and (INDEX_DIR / "faiss.index").exists():
        try:
            _index = faiss.read_index(str(INDEX_DIR / "faiss.index"))
            with open(INDEX_DIR / "metadata.pkl", "rb") as f:
                _docs = pickle.load(f)
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}")


def preload():
    global _loaded
    if _loaded:
        return
    _loaded = True
    logger.info("Preloading SentenceTransformer model and FAISS index...")
    _load()
    if _model is not None:
        logger.info(f"SentenceTransformer model loaded: {MODEL_NAME}")
    if _index is not None:
        logger.info(f"FAISS index loaded: {_index.ntotal} vectors")


def retrieve(query: str, top_k: int = 5) -> list[dict]:
    _load()
    if _index is None or _model is None:
        return []

    embedding = _model.encode([query], normalize_embeddings=True).astype("float32")
    scores, indices = _index.search(embedding, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx >= 0 and idx < len(_docs):
            results.append({**_docs[idx], "score": float(score)})
    return results
