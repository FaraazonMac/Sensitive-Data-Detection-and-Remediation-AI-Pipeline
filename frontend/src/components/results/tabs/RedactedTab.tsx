import { EmptyState } from "../EmptyState";

interface RedactedTabProps {
  redactedText: string;
  maskedText: string;
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function RedactedTab({ redactedText, maskedText }: RedactedTabProps) {
  if (!redactedText) {
    return <EmptyState tag="Empty" title="Nothing to redact" />;
  }

  return (
    <div>
      <pre className="max-h-[380px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-hairline bg-panel-hover p-4 font-mono text-[13px] leading-relaxed text-text-mid">
        {redactedText}
      </pre>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => download("redacted.txt", redactedText)}
          className="rounded-md border border-hairline bg-panel-hover px-3 py-1.5 text-sm text-text-mid hover:border-signal hover:text-signal-soft"
        >
          Download redacted (.txt)
        </button>
        <button
          onClick={() => download("masked.txt", maskedText)}
          className="rounded-md border border-hairline bg-panel-hover px-3 py-1.5 text-sm text-text-mid hover:border-signal hover:text-signal-soft"
        >
          Download masked (.txt)
        </button>
      </div>
    </div>
  );
}
