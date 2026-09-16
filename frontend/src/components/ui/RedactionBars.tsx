interface RedactionBarsProps {
  className?: string;
  animate?: boolean;
}

// Fixed widths, not random — avoids layout flicker and keeps the motif
// legible as "redacted lines of text" rather than noise.
const LINE_WIDTHS = ["62%", "84%", "40%", "71%", "55%", "90%", "35%"];

/**
 * The one signature visual element: horizontal black bars mimicking a
 * redacted document — literally the artifact this tool produces, not a
 * decorative shape. Used in empty states and as a quiet background motif.
 */
export function RedactionBars({ className = "", animate = true }: RedactionBarsProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {LINE_WIDTHS.map((width, i) => (
        <div
          key={i}
          className={`h-2.5 rounded-sm bg-redact ${animate ? "origin-left animate-redact-wipe" : ""}`}
          style={{ width, animationDelay: animate ? `${i * 70}ms` : undefined }}
        />
      ))}
    </div>
  );
}
