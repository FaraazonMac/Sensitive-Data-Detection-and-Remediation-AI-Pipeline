import type { Category, Risk } from "@/api/types";

const CATEGORY_STYLES: Record<Category, string> = {
  PII: "bg-pii/15 text-pii border-pii/40",
  PHI: "bg-phi/15 text-red-300 border-phi/50",
  Financial: "bg-financial/15 text-financial border-financial/40",
  Other: "bg-other/15 text-other border-other/40",
};

const RISK_STYLES: Record<string, string> = {
  High: "bg-pii/15 text-pii border-pii/40",
  Medium: "bg-other/15 text-other border-other/40",
  Low: "bg-success/15 text-success border-success/40",
  None: "bg-hairline text-text-dim border-hairline",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-xs font-semibold ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Other}`}
    >
      {category}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: Risk | "None" }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-xs font-semibold ${RISK_STYLES[risk] ?? RISK_STYLES.None}`}
    >
      {risk}
    </span>
  );
}
