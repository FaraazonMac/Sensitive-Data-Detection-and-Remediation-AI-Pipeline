import type { ScanSummary } from "@/api/types";

function MetricCard({
  label,
  value,
  textTone,
  borderTone,
  bgTone,
}: {
  label: string;
  value: string | number;
  textTone: string;
  borderTone: string;
  bgTone: string;
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${borderTone} ${bgTone}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-text-meta">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-bold ${textTone}`}>{value}</div>
    </div>
  );
}

const RISK_STYLE: Record<string, { text: string; border: string; bg: string }> = {
  High: { text: "text-pii", border: "border-pii/30", bg: "bg-pii/[0.06]" },
  Medium: { text: "text-other", border: "border-other/30", bg: "bg-other/[0.06]" },
  Low: { text: "text-success", border: "border-success/30", bg: "bg-success/[0.06]" },
  None: { text: "text-text-dim", border: "border-hairline", bg: "bg-panel-hover" },
};

export function MetricGrid({ summary }: { summary: ScanSummary }) {
  const categories = summary.categories ?? {};
  const risk = RISK_STYLE[summary.overall_risk] ?? RISK_STYLE.None;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard
        label="PII"
        value={categories["PII"] ?? 0}
        textTone="text-pii"
        borderTone="border-pii/25"
        bgTone="bg-pii/[0.06]"
      />
      <MetricCard
        label="PHI"
        value={categories["PHI"] ?? 0}
        textTone="text-red-300"
        borderTone="border-phi/30"
        bgTone="bg-phi/[0.08]"
      />
      <MetricCard
        label="Financial"
        value={categories["Financial"] ?? 0}
        textTone="text-financial"
        borderTone="border-financial/25"
        bgTone="bg-financial/[0.06]"
      />
      <MetricCard
        label="Overall risk"
        value={summary.overall_risk}
        textTone={risk.text}
        borderTone={risk.border}
        bgTone={risk.bg}
      />
    </div>
  );
}
