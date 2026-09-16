---
title: Sensitive Data Detection and Remediation Pipeline
emoji: 🛡️
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
---

# Sensitive Data Detection and Remediation Pipeline — Backend (FastAPI)

FastAPI wrapper around the existing detection pipeline. Only `main.py` is
new — every other file here (`pipeline.py`, `detector.py`, `ocr_engine.py`,
`rag_engine.py`, `reasoner.py`, `redactor.py`, `rules.json`) is unchanged
from the original Streamlit project.

## Setup

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
python -m spacy download en_core_web_lg

copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
# then edit .env and add your real GEMINI_API_KEY

python setup_models.py         # one-time model download (GLiNER, embeddings)
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

First startup will be slow (loading spaCy/Presidio/GLiNER/ChromaDB into
memory) — wait for `Pipeline ready.` in the terminal before scanning from
the frontend. Check `http://localhost:8000/health` to confirm it's up.

## API

**POST /scan** — multipart/form-data
- `text` (string, optional) — raw text to scan
- `file` (file, optional) — file to scan (.txt/.pdf/.png/.jpg/.jpeg/.bmp/.tiff)
- `redaction_mode` (string) — `redact` | `mask` | `replace`
- `use_reasoner` (bool) — whether to call the Gemini explanation step

Provide either `text` or `file`, not both. Returns the full `PipelineResult`
as JSON (same fields as `pipeline.py`'s dataclass: `findings`, `summary`,
`compliance_rules`, `compliance_exposure`, `explanation`, `redacted_text`,
`masked_text`, `highlighted_html`, `warnings`).

**GET /health** — `{"status": "ok", "pipeline_loaded": true}` once ready.

**POST /remediate** — multipart/form-data
- `text` (string) — the ORIGINAL scanned text (`PipelineResult.original_text`), not a previously-remediated version
- `applied` (JSON string) — array of `{start, end, entity_type, action?}` objects, one per finding the user has clicked "Apply" on so far. Send the FULL accumulated list every call, not just the newest item — the endpoint always recomputes from `text` using every item in `applied`, since replacement strings are a different length than the originals and re-applying to already-edited text would misalign later offsets. `action` is optional per item (`redact` | `mask` | `tokenize`); if omitted, the entity type's recommended action from `detector.REMEDIATION_MAP` is used.

Returns `{"updated_text": "..."}`.

## CORS

`main.py` allows `http://localhost:5173` (the Vite dev server) by default.
Add your deployed frontend's origin to the `allow_origins` list in
`main.py` before deploying.
