import { EmptyState } from "../EmptyState";

export function ExplainTab({ explanation }: { explanation: string }) {
  if (!explanation) {
    return (
      <EmptyState
        tag="Disabled"
        title="AI explanation disabled"
        subtitle="Enable it in the sidebar to get a plain-English risk summary."
      />
    );
  }

  return (
    <div className="rounded-lg border border-signal-border bg-signal-bg p-4 text-sm leading-relaxed text-text-mid">
      {explanation}
    </div>
  );
}
