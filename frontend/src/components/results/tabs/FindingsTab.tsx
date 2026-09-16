import type { Finding } from "@/api/types";
import { DataTable } from "@/components/ui/DataTable";
import { CategoryBadge, RiskBadge } from "@/components/ui/Badge";
import { EmptyState } from "../EmptyState";

// Read-only findings list. Remediation (guidance + Apply) lives in its own
// dedicated tab (RemediationTab.tsx) rather than a column here — one place
// to take action, not two.
export function FindingsTab({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return <EmptyState tag="Empty" title="No findings to list" />;
  }

  return (
    <DataTable<Finding>
      columns={[
        { header: "Entity", render: (f) => <span className="font-mono">{f.entity_type}</span> },
        { header: "Category", render: (f) => <CategoryBadge category={f.category} /> },
        { header: "Risk", render: (f) => <RiskBadge risk={f.risk} /> },
        { header: "Value", render: (f) => <span className="font-mono text-text-dim">{f.value}</span> },
        { header: "Source", render: (f) => <span className="text-xs text-text-meta">{f.source}</span> },
      ]}
      rows={findings}
    />
  );
}
