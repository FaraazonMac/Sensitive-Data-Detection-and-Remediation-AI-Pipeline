import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { InputPanel } from "@/components/input/InputPanel";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { runScan, runRemediate, ApiError, type AppliedRemediation } from "@/api/client";
import type { RedactionMode, ScanResult, Finding } from "@/api/types";

export function ScanPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [redactionMode, setRedactionMode] = useState<RedactionMode>("redact");
  const [useReasoner, setUseReasoner] = useState(true);

  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One-click per-finding remediation. `applied` accumulates every finding
  // the user has actioned so far — sent in full on every call, since the
  // backend always recomputes from original_text (see api/client.ts).
  const [applied, setApplied] = useState<AppliedRemediation[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  function findingId(f: Finding) {
    return f.id ?? `${f.start}-${f.end}-${f.entity_type}`;
  }

  async function handleScan() {
    setLoading(true);
    setError(null);
    setResult(null);
    setApplied([]);
    setAppliedIds(new Set());

    try {
      const data = await runScan({ text, file, redactionMode, useReasoner });
      setResult(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `${err.message} (${err.status})`
          : "Could not reach the backend. Is the FastAPI server running?";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(finding: Finding) {
    if (!result) return;
    const id = findingId(finding);
    setPendingId(id);
    setError(null);

    const nextApplied = [...applied, { finding }];
    try {
      const { updated_text } = await runRemediate({
        originalText: result.original_text,
        applied: nextApplied,
      });
      setApplied(nextApplied);
      setAppliedIds((prev) => new Set(prev).add(id));
      setResult({ ...result, redacted_text: updated_text });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `${err.message} (${err.status})`
          : "Could not apply remediation. Is the FastAPI server running?";
      setError(message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar
        redactionMode={redactionMode}
        onRedactionModeChange={setRedactionMode}
        useReasoner={useReasoner}
        onUseReasonerChange={setUseReasoner}
      />
      <main className="flex-1 p-4 sm:p-7">
        <PageHeader />
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <InputPanel
            text={text}
            onTextChange={setText}
            file={file}
            onFileChange={setFile}
            onScan={handleScan}
            loading={loading}
          />
          <ResultsPanel
            result={result}
            loading={loading}
            error={error}
            onApplyRemediation={handleApply}
            appliedIds={appliedIds}
            pendingRemediationId={pendingId}
          />
        </div>
      </main>
    </div>
  );
}
