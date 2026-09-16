# Hugging Face Spaces (Docker SDK) requires listening on port 7860.
FROM python:3.11-slim

WORKDIR /app

# System deps needed by opencv (used in ocr_engine.py) and pymupdf
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download models at BUILD time, not at container startup — avoids a slow
# first request (or a request timeout) while spaCy/GLiNER/embeddings download.
RUN python -m spacy download en_core_web_lg
COPY setup_models.py .
COPY detector.py ocr_engine.py rag_engine.py reasoner.py redactor.py pipeline.py rules.json .
RUN python setup_models.py || true
# `|| true` because setup_models.py's Gemini key check will fail at build
# time (no secret available yet) — that's fine, it still downloads GLiNER
# and the embedding model, which is all we need baked into the image.

COPY main.py .

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
