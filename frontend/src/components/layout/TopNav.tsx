import { ShieldIcon } from "@/components/ui/Icons";

export function TopNav() {
  return (
    <div className="sticky top-0 z-10 flex h-11 items-center border-b border-hairline bg-ink-navy/80 px-4 backdrop-blur-md sm:px-7">
      <div className="flex items-center gap-1.5 truncate font-mono text-[13px] text-text-dim">
        <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-signal-soft" />
        <span className="truncate">Sensitive Data Detection</span>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-[13px] text-text-dim">
        <span className="status-dot" />
        <span className="hidden sm:inline">local detection · cloud reasoning</span>
      </div>
    </div>
  );
}
