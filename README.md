# Sensitive Data Detection and Remediation Pipeline

Detects PII, PHI, and financial data in text, PDFs, and images — maps every
finding to the compliance rules it triggers (HIPAA / GDPR / PCI-DSS / CCPA /
GLBA) — then recommends and lets you apply a protection method (redact,
mask, or tokenize) for each individual finding, not just a blanket pass
over the whole document.

Runs entirely local by default; only a short entity-type summary is sent
out (optionally, to Gemini) for the plain-language explanation step.

## How it works

```
OCR  →  Detect  →  RAG  →  Redact (bulk)  →  Remediate (per-finding)
```

1. **OCR** — extract text from PDFs/images
2. **Detect** — Presidio + GLiNER + regex, layered for coverage
3. **RAG** — map each finding to the specific compliance rules it triggers, via a ChromaDB-backed ruleset
4. **Redact** — one blanket mode (redact/mask/replace) applied across the whole document
5. **Remediate** — per-finding guidance ("tokenize — PCI-DSS Requirement 3 prohibits storing readable PAN") with a one-click action, independent of the bulk mode above

## Stack

- **Backend**: FastAPI, Presidio, GLiNER, spaCy, ChromaDB, Gemini (reasoning step)
- **Frontend**: React, Vite, TypeScript, Tailwind

## Project layout

```
backend/    FastAPI app — see backend/README.md for setup + API reference
frontend/   React/Vite app — see frontend/README.md for setup
```

## Quick start

Run the backend and frontend in two separate terminals — see each
subfolder's README for full setup (model downloads, `.env`, etc.):

```bash
# Terminal 1
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend
npm run dev
```

Then open `http://localhost:5173`.

## Deployment

- **Backend** → Hugging Face Spaces (Docker SDK) — `backend/Dockerfile` is
  already set up for this (port 7860, models baked in at build time). Add
  `GEMINI_API_KEY` as a Space secret.
- **Frontend** → Vercel, with `VITE_API_BASE_URL` set to your deployed
  backend's URL.
- Once both are live, add the frontend's real URL to `allow_origins` in
  `backend/main.py`.

## Snaps 
1. <img width="918" height="817" alt="image" src="https://github.com/user-attachments/assets/6b52c5c9-f084-4075-861a-7fbe0b2d3490" />

2. <img width="891" height="783" alt="image" src="https://github.com/user-attachments/assets/d58e84ca-57d5-447d-a9d9-b7c7433bc4dd" />

3. <img width="878" height="745" alt="image" src="https://github.com/user-attachments/assets/2fb4db01-5b16-44c9-aacc-b3cff27f82ca" />

## Contact & Info

- **Analyst:** Mohammed Faraaz Shaik — [faraazshaik05042005@gmail.com](mailto:faraazshaik05042005@gmail.com)
- **LinkedIn:** [Mohammed Faraaz Shaik](https://www.linkedin.com/in/mohammed-faraaz-shaik)
- **GitHub:** [FaraazonMac](https://github.com/FaraazonMac)
