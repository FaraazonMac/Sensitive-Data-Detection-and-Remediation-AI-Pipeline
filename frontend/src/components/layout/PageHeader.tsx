import { ScanLineIcon, EyeSearchIcon, LayersIcon, EraserIcon, ShieldIcon, CheckShieldIcon } from "@/components/ui/Icons";
import type { ComponentType } from "react";

const STAGES: {
  label: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  { label: "OCR", detail: "extract text", icon: ScanLineIcon, tone: "text-sky-400 bg-sky-400/10 border-sky-400/25" },
  { label: "Detect", detail: "Presidio + GLiNER + regex", icon: EyeSearchIcon, tone: "text-signal-soft bg-signal-bg border-signal-border" },
  { label: "Verify", detail: "AI context check (masked)", icon: CheckShieldIcon, tone: "text-sky-400 bg-sky-400/10 border-sky-400/25" },
  { label: "RAG", detail: "map to HIPAA/GDPR/PCI/CCPA/GLBA", icon: LayersIcon, tone: "text-other bg-other/10 border-other/25" },
  { label: "Redact", detail: "redact / mask / replace", icon: EraserIcon, tone: "text-pii bg-pii/10 border-pii/25" },
  { label: "Remediate", detail: "per-finding guidance + one-click fix", icon: ShieldIcon, tone: "text-success bg-success/10 border-success/25" },
];

export function PageHeader() {
  return (
    <div className="mx-auto mb-7 max-w-6xl">
      <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-signal-soft">
        Sensitive Data Detection
      </div>
      <h1 className="mb-6 max-w-2xl text-[15px] leading-relaxed text-text-mid">
        Detects PII, PHI, and financial data in text, PDFs, and images, then
        verifies each finding against its surrounding sentence to drop false
        positives — tool names, field labels, generic words — before mapping
        it to the compliance rules it triggers and recommending a
        protection method. Detection always runs on-device; the optional AI
        step only ever sees entity types and masked context, never the
        actual sensitive values.
      </h1>

      <div className="flex items-center gap-x-2 gap-y-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STAGES.map((stage, i) => (
          <div key={stage.label} className="flex shrink-0 items-center gap-2">
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${stage.tone}`}>
              <stage.icon className="h-4 w-4 shrink-0" />
              <span className="font-mono text-[13px] font-semibold">{stage.label}</span>
              <span className="hidden text-xs opacity-70 sm:inline">{stage.detail}</span>
            </div>
            {i < STAGES.length - 1 && (
              <span className="text-text-dim">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
