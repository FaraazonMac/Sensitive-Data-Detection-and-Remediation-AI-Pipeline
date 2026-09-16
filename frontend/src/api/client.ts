import type { ScanResult, RedactionMode, Finding, RemediationType } from "./types";

// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.ts).
// In prod, set VITE_API_BASE_URL to your deployed FastAPI URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RunScanArgs {
  text: string;
  file: File | null;
  redactionMode: RedactionMode;
  useReasoner: boolean;
}

async function handleResponse(res: Response): Promise<ScanResult> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

/**
 * Single scan endpoint, matching the backend's POST /scan — mirrors how
 * app.py always called pipeline.run() with one `source`, either raw text
 * or file bytes. Provide either `file` or `text`, not both; `file` wins
 * if both happen to be set.
 */
export async function runScan({
  text,
  file,
  redactionMode,
  useReasoner,
}: RunScanArgs): Promise<ScanResult> {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  } else {
    formData.append("text", text);
  }
  formData.append("redaction_mode", redactionMode);
  formData.append("use_reasoner", String(useReasoner));

  const res = await fetch(`${BASE_URL}/scan`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

export interface AppliedRemediation {
  finding: Finding;
  action?: RemediationType;
}

interface RunRemediateArgs {
  originalText: string;
  applied: AppliedRemediation[];
}

interface RemediateResponse {
  updated_text: string;
}

/**
 * One-click per-finding remediation — POST /remediate.
 *
 * IMPORTANT: `originalText` must be ScanResult.original_text, and `applied`
 * must be the FULL accumulated list of every finding the user has clicked
 * "Apply" on so far — not just the newest one. The backend recomputes the
 * result from the original text each call, since replacement strings are a
 * different length than the originals and re-applying to already-edited
 * text would misalign every subsequent finding's offsets.
 */
export async function runRemediate({
  originalText,
  applied,
}: RunRemediateArgs): Promise<RemediateResponse> {
  const formData = new FormData();
  formData.append("text", originalText);
  formData.append(
    "applied",
    JSON.stringify(
      applied.map(({ finding, action }) => ({
        start: finding.start,
        end: finding.end,
        entity_type: finding.entity_type,
        action: action ?? finding.remediation_type,
      }))
    )
  );

  const res = await fetch(`${BASE_URL}/remediate`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // not JSON — fall back to statusText
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}
