# Sensitive Data Detection and Remediation Pipeline — Frontend

React + Vite + TypeScript + Tailwind port of the original Streamlit UI.

## Setup

```bash
npm install
cp .env.example .env.local   # only needed if your backend isn't on localhost:8000
npm run dev
```

Runs at `http://localhost:5173`. Requires the FastAPI backend running at
`http://localhost:8000` (proxied via `/api`, see `vite.config.ts`).

## API contract

Matches the FastAPI backend's `POST /scan` (multipart form: `text` OR
`file`, plus `redaction_mode` and `use_reasoner`) and `POST /remediate`
(one-click per-finding protection action — see the backend's `main.py`
for the exact routes).

`src/api/types.ts` mirrors `pipeline.py`'s `PipelineResult` and
`detector.py`'s `Finding` dataclasses field-for-field (confirmed against
the actual source, not guessed). If you ever rename a field in those
dataclasses, update this file to match.

## Structure

```
src/
├── components/
│   ├── layout/     TopNav, Sidebar
│   ├── input/       text/file input, sample dropdown, scan button
│   ├── results/     metric grid, tabbed results (highlighted/redacted/findings/compliance/explain)
│   └── ui/          Card, Badge, Tabs, DataTable — generic primitives
├── pages/
│   └── ScanPage.tsx   owns all state, wires input -> API -> results
├── api/
│   ├── client.ts     fetch wrapper
│   └── types.ts      TS interfaces mirroring the backend response
└── styles/
    └── index.css     Tailwind entrypoint
```

## Design tokens

Colors/fonts are centralized in `tailwind.config.js`, lifted from the
original Streamlit `<style>` block (`#0B1120` ink-navy base, Space
Grotesk/Inter/JetBrains Mono type system, risk-based color coding for
PII/PHI/Financial categories).

## Sample data

`src/components/input/samples.ts` has placeholder sample texts — swap in
your actual `SAMPLES` dict content from the original `app.py`.
