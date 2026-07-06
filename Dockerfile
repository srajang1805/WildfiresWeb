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

# ML deps — install torch CPU-only, then sentence-transformers (skips 2GB CUDA)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir sentence-transformers faiss-cpu xgboost scikit-learn

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 app && chown -R app:app /app
USER app

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
