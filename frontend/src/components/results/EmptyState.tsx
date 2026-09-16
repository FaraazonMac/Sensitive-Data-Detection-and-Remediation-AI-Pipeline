import type { ReactNode } from "react";

interface EmptyStateProps {
  tag?: string;
  tagTone?: "dim" | "signal" | "risk" | "success";
  title: string;
  subtitle?: string;
  visual?: ReactNode;
}

const TAG_TONES: Record<string, string> = {
  dim: "border-hairline text-text-dim",
  signal: "border-signal-border bg-signal-bg text-signal-soft",
  risk: "border-pii/40 bg-pii/10 text-pii",
  success: "border-success/40 bg-success/10 text-success",
};

export function EmptyState({ tag, tagTone = "dim", title, subtitle, visual }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {visual}
      {tag && (
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${TAG_TONES[tagTone]}`}
        >
          {tag}
        </span>
      )}
      <div className="text-[15px] font-medium text-text-mid">{title}</div>
      {subtitle && <div className="max-w-xs text-sm leading-relaxed text-text-dim">{subtitle}</div>}
    </div>
  );
}
