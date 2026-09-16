import type { Finding, RemediationType } from "@/api/types";
import { CategoryBadge, RiskBadge } from "@/components/ui/Badge";
import { EmptyState } from "../EmptyState";

interface RemediationTabProps {
  findings: Finding[];
  onApply: (finding: Finding) => void;
  appliedIds: Set<string>;
  pendingId: string | null;
}

const ACTION_STYLES: Record<RemediationType, string> = {
  redact: "bg-pii/15 text-pii border-pii/40",
  mask: "bg-other/15 text-other border-other/40",
  tokenize: "bg-signal-bg text-signal-soft border-signal-border",
};

function ActionBadge({ type }: { type: RemediationType }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-xs font-semibold uppercase ${ACTION_STYLES[type] ?? ACTION_STYLES.redact}`}
    >
      {type}
    </span>
  );
}

/** Client-side preview only — a quick approximation of the server's
 * result so the card can show *something* changed immediately. The
 * Redacted tab always holds the exact, authoritative text. */
function previewFor(finding: Finding, type: RemediationType): string {
  if (type === "redact") return `[${finding.entity_type}]`;
  if (type === "tokenize") return `[${finding.entity_type}_••••••••]`;
  // mask
  const v = finding.value;
  return v.length > 4 ? "*".repeat(v.length - 4) + v.slice(-4) : "*".repeat(v.length);
}

export function RemediationTab({ findings, onApply, appliedIds, pendingId }: RemediationTabProps) {
  if (findings.length === 0) {
    return <EmptyState tag="Empty" title="Nothing to remediate" subtitle="No sensitive data was found in this document." />;
  }

  function findingId(f: Finding) {
    return f.id ?? `${f.start}-${f.end}-${f.entity_type}`;
  }

  return (
    <div className="flex flex-col gap-3">
      {findings.map((f) => {
        const id = findingId(f);
        const type: RemediationType = f.remediation_type ?? "redact";
        const applied = appliedIds.has(id);
        const pending = pendingId === id;

        return (
          <div
            key={id}
            className={`rounded-xl border px-4 py-3.5 transition-colors ${
              applied ? "border-success/30 bg-success/5" : "border-hairline bg-panel-hover"
            }`}
          >
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-text-bright">{f.entity_type}</span>
                  <CategoryBadge category={f.category} />
                  <RiskBadge risk={f.risk} />
                  <ActionBadge type={type} />
                </div>

                <div className="mt-2 font-mono text-[13px] text-text-dim">
                  {applied ? (
                    <>
                      <span className="line-through decoration-text-dim/50">{f.value}</span>
                      <span className="mx-2 text-text-meta">→</span>
                      <span className="text-success-soft">{previewFor(f, type)}</span>
                    </>
                  ) : (
                    <span className="text-text-mid">{f.value}</span>
                  )}
                </div>

                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-text-dim">
                  {f.recommended_action || "Review before sharing — treat as sensitive until classified."}
                </p>
              </div>

              <button
                type="button"
                disabled={applied || pending}
                onClick={() => onApply(f)}
                className={
                  applied
                    ? "shrink-0 rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-sm font-medium text-success-soft"
                    : "shrink-0 rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-text-mid transition hover:border-signal hover:text-signal-soft disabled:cursor-not-allowed disabled:opacity-50"
                }
              >
                {applied ? "✓ Applied" : pending ? "Applying…" : "Apply"}
              </button>
            </div>
          </div>
        );
      })}

      {appliedIds.size > 0 && (
        <div className="mt-1 text-center text-xs text-text-dim">
          {appliedIds.size} of {findings.length} applied — see the{" "}
          <span className="font-medium text-signal-soft">Redacted</span> tab for the exact output.
        </div>
      )}
    </div>
  );
}
