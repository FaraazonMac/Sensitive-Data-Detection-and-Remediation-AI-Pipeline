"""
main.py
-------
FastAPI backend for the Sensitive Data Detection and Remediation Pipeline.

Wraps the detection pipeline (pipeline.py) with two endpoints: POST /scan
(detect + classify + explain + bulk-redact) and POST /remediate (apply a
per-finding protection action — redact, mask, or tokenize — one finding
at a time).

Run with:
    uvicorn main:app --reload --port 8000
"""

import dataclasses
import json
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pipeline import Pipeline
from detector import Finding, _remediation_for

app = FastAPI(title="Sensitive Data Detection and Remediation Pipeline")

# Allow the Vite dev server to call this API directly (no proxy required).
# Add your deployed frontend's origin here too once you host it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # Add your deployed frontend's origin here too once you host it, e.g.:
        # "https://sensitive-data-pipeline.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Loaded once at startup, reused across requests — mirrors app.py's
# @st.cache_resource get_pipeline() pattern, just without Streamlit's cache.
pipeline: Optional[Pipeline] = None


@app.on_event("startup")
def load_models():
    global pipeline
    print("Loading detection pipeline (this can take a minute on first run)...")
    pipeline = Pipeline(load_reasoner=True)
    pipeline.initialise()
    print("Pipeline ready.")


@app.get("/health")
def health():
    return {"status": "ok", "pipeline_loaded": pipeline is not None}


@app.post("/scan")
async def scan(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    redaction_mode: str = Form("redact"),
    use_reasoner: bool = Form(True),
):
    """
    Single endpoint for both input modes, matching how app.py always called
    pipeline.run() with one `source` — either raw text or file bytes.

    Frontend sends multipart/form-data with EITHER `text` OR `file` set
    (not both), plus redaction_mode and use_reasoner.
    """
    if not text and not file:
        raise HTTPException(400, "Provide either `text` or `file`.")

    if redaction_mode not in {"redact", "mask", "replace"}:
        raise HTTPException(400, f"Invalid redaction_mode: {redaction_mode}")

    if file:
        source = await file.read()
        filename = file.filename or "upload"
    else:
        source = text
        filename = "input.txt"

    if pipeline is None:
        raise HTTPException(503, "Pipeline is still loading — try again shortly.")

    try:
        result = pipeline.run(
            source=source,
            filename=filename,
            redaction_mode=redaction_mode,
            use_reasoner=use_reasoner,
        )
    except Exception as e:
        # Surfaces the real error to the frontend instead of a bare 500,
        # and prints the full traceback server-side for debugging.
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Pipeline error: {e}")

    # PipelineResult / Finding are dataclasses — convert to plain dict
    # so FastAPI can serialize the response as JSON.
    return dataclasses.asdict(result)


@app.post("/remediate")
async def remediate(
    text: str = Form(...),
    applied: str = Form(...),
):
    """
    One-click per-finding remediation.

    `text` must be the ORIGINAL scanned text (PipelineResult.original_text),
    not a previously-remediated version — every call recomputes the result
    from scratch using the full accumulated set of applied findings, so the
    frontend should re-send the whole `applied` list (every finding the
    user has clicked "Apply" on so far) each time, not just the newest one.
    This avoids offset corruption: replacement strings are a different
    length than the originals, so re-applying to already-edited text would
    silently misalign every subsequent finding.

    `applied` is a JSON array of objects: {start, end, entity_type, action?}.
    `action` is optional per item — if omitted, the entity type's
    recommended remediation_type (from detector.REMEDIATION_MAP) is used.
    """
    if pipeline is None:
        raise HTTPException(503, "Pipeline is still loading — try again shortly.")

    try:
        items = json.loads(applied)
    except json.JSONDecodeError:
        raise HTTPException(400, "`applied` must be a JSON array.")

    findings_with_modes = []
    for item in items:
        start, end, entity_type = item.get("start"), item.get("end"), item.get("entity_type")
        if start is None or end is None or entity_type is None:
            raise HTTPException(400, f"Each applied item needs start/end/entity_type: {item}")
        if not (0 <= start < end <= len(text)):
            raise HTTPException(400, f"Finding offsets out of range for the provided text: {item}")

        recommended_action, remediation_type = _remediation_for(entity_type)
        mode = item.get("action") or remediation_type
        if mode not in {"redact", "mask", "tokenize"}:
            raise HTTPException(400, f"Invalid action: {mode}")

        finding = Finding(
            entity_type=entity_type,
            category="Other",
            value=text[start:end],
            start=start,
            end=end,
            score=1.0,
            risk="Medium",
            source="manual",
            reason="",
            id=f"{start}-{end}-{entity_type}",
            recommended_action=recommended_action,
            remediation_type=mode,
        )
        findings_with_modes.append((finding, mode))

    updated_text = pipeline._redactor.remediate(text, findings_with_modes)
    return {"updated_text": updated_text}
