import type { ComplianceRule } from "@/api/types";
import { EmptyState } from "../EmptyState";

interface ComplianceTabProps {
  exposure: Record<string, number>;
  rules: ComplianceRule[];
}

function ExposureBar({ framework, score }: { framework: string; score: number }) {
  const tone = score >= 70 ? "bg-pii" : score >= 40 ? "bg-other" : "bg-success";
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between font-mono text-xs text-text-meta">
        <span>{framework}</span>
        <span>{score.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-panel-hover">
        <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function ComplianceTab({ exposure, rules }: ComplianceTabProps) {
  const frameworks = Object.entries(exposure);

  if (frameworks.length === 0) {
    return <EmptyState tag="None triggered" title="No compliance frameworks triggered" />;
  }

  return (
    <div>
      <div className="mb-5">
        {frameworks.map(([fw, score]) => (
          <ExposureBar key={fw} framework={fw} score={score} />
        ))}
      </div>

      <div className="space-y-2">
        {rules.map((rule, i) => (
          <details
            key={i}
            className="rounded-lg border border-hairline bg-panel-hover px-3 py-2"
          >
            <summary className="cursor-pointer text-sm font-medium text-text-mid">
              [{rule.framework}] {rule.rule}
            </summary>
            <p className="mt-2 text-xs text-text-dim">{rule.description}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
