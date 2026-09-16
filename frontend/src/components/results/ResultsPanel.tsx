import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { RedactionBars } from "@/components/ui/RedactionBars";
import { MetricGrid } from "./MetricGrid";
import { EmptyState } from "./EmptyState";
import { HighlightedTab } from "./tabs/HighlightedTab";
import { RemediationTab } from "./tabs/RemediationTab";
import { RedactedTab } from "./tabs/RedactedTab";
import { FindingsTab } from "./tabs/FindingsTab";
import { ComplianceTab } from "./tabs/ComplianceTab";
import { ExplainTab } from "./tabs/ExplainTab";
import type { ScanResult, Finding } from "@/api/types";

interface ResultsPanelProps {
  result: ScanResult | null;
  loading: boolean;
  error: string | null;
  onApplyRemediation?: (finding: Finding) => void;
  appliedIds?: Set<string>;
  pendingRemediationId?: string | null;
}

export function ResultsPanel({
  result,
  loading,
  error,
  onApplyRemediation,
  appliedIds,
  pendingRemediationId,
}: ResultsPanelProps) {
  return (
    <Card>
      <CardHeader
        title="Results"
        meta={result ? `${result.findings.length} findings` : undefined}
      />
      <CardBody>
        {loading && (
          <EmptyState
            tag="Scanning"
            tagTone="signal"
            title="Running detection pipeline"
            subtitle="OCR → detect → RAG lookup → reasoning → redact"
          />
        )}

        {!loading && error && (
          <EmptyState tag="Error" tagTone="risk" title="Scan failed" subtitle={error} />
        )}

        {!loading && !error && !result && (
          <EmptyState
            visual={<RedactionBars className="mb-1 w-40" />}
            title="Ready to scan"
            subtitle="Paste text or upload a file, then hit Scan document."
          />
        )}

        {!loading && !error && result && (
          <>
            <MetricGrid summary={result.summary} />
            <div className="mt-4 -mx-5">
              <Tabs
                tabs={[
                  {
                    id: "highlighted",
                    label: "Highlighted",
                    content: (
                      <HighlightedTab
                        highlightedHtml={result.highlighted_html}
                        hasFindings={result.findings.length > 0}
                      />
                    ),
                  },
                  {
                    id: "remediation",
                    label:
                      appliedIds && appliedIds.size > 0
                        ? `Remediation (${appliedIds.size}/${result.findings.length})`
                        : "Remediation",
                    content: (
                      <RemediationTab
                        findings={result.findings}
                        onApply={onApplyRemediation ?? (() => {})}
                        appliedIds={appliedIds ?? new Set()}
                        pendingId={pendingRemediationId ?? null}
                      />
                    ),
                  },
                  {
                    id: "redacted",
                    label: "Redacted",
                    content: (
                      <RedactedTab
                        redactedText={result.redacted_text}
                        maskedText={result.masked_text}
                      />
                    ),
                  },
                  {
                    id: "findings",
                    label: "Findings",
                    content: <FindingsTab findings={result.findings} />,
                  },
                  {
                    id: "compliance",
                    label: "Compliance",
                    content: (
                      <ComplianceTab
                        exposure={result.compliance_exposure}
                        rules={result.compliance_rules}
                      />
                    ),
                  },
                  {
                    id: "explain",
                    label: "Explain",
                    content: <ExplainTab explanation={result.explanation} />,
                  },
                ]}
              />
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
