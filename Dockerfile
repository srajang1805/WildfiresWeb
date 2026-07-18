FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir sentence-transformers faiss-cpu xgboost scikit-learn catboost

ENV HF_HOME=/app/.cache/huggingface
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY . .

# Move engine modules into wildfire_engine/ subdirectory for correct import paths
RUN mkdir -p wildfire_engine && \
    mv __init__.py wildfire_engine/ 2>/dev/null || true && \
    mv config wildfire_engine/ 2>/dev/null || true && \
    mv utils wildfire_engine/ 2>/dev/null || true && \
    mv inference wildfire_engine/ 2>/dev/null || true && \
    mv weather wildfire_engine/ 2>/dev/null || true

EXPOSE 8000

RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 app && chown -R app:app /app
USER app

CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
