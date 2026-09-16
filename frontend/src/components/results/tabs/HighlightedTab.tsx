import { EmptyState } from "../EmptyState";

interface HighlightedTabProps {
  highlightedHtml: string;
  hasFindings: boolean;
}

export function HighlightedTab({ highlightedHtml, hasFindings }: HighlightedTabProps) {
  if (!hasFindings) {
    return (
      <EmptyState
        tag="Clean"
        tagTone="success"
        title="No sensitive data found"
        subtitle="This document appears safe to share as-is."
      />
    );
  }

  // SAFE: `highlighted_html` is generated entirely by our own FastAPI backend
  // (redactor.py's highlight_html()) from findings it detected itself — it
  // never echoes back arbitrary third-party HTML. Still worth re-confirming
  // server-side escaping stays intact if that function ever changes.
  return (
    <div
      className="max-h-[420px] overflow-y-auto rounded-lg border border-hairline bg-panel-hover p-4"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
}
