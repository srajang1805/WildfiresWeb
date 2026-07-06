import json
import os
import pickle
from pathlib import Path
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"
INDEX_DIR = Path(__file__).parent / "index"
MODEL_NAME = "all-MiniLM-L6-v2"


def load_documents():
    docs = []
    for f in sorted(KNOWLEDGE_DIR.glob("*.json")):
        with open(f) as fp:
            data = json.load(fp)
            if isinstance(data, list):
                docs.extend(data)
            else:
                docs.append(data)
    return docs


def build_index():
    docs = load_documents()
    texts = [d["content"] for d in docs]

    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)
    embeddings = np.array(embeddings).astype("float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_DIR / "faiss.index"))

    with open(INDEX_DIR / "metadata.pkl", "wb") as f:
        pickle.dump(docs, f)

    print(f"Index built: {len(docs)} documents, dim={dim}")


if __name__ == "__main__":
    build_index()
