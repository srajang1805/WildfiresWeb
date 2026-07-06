import pickle
from pathlib import Path
import numpy as np
import faiss

INDEX_DIR = Path(__file__).parent / "index"
MODEL_NAME = "all-MiniLM-L6-v2"

_model = None
_index = None
_docs: list[dict] = []


def _load():
    global _model, _index, _docs
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
    if _index is None and (INDEX_DIR / "faiss.index").exists():
        _index = faiss.read_index(str(INDEX_DIR / "faiss.index"))
        with open(INDEX_DIR / "metadata.pkl", "rb") as f:
            _docs = pickle.load(f)


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
