import type { RedactionMode } from "@/api/types";
import { ShieldIcon } from "@/components/ui/Icons";

interface SidebarProps {
  redactionMode: RedactionMode;
  onRedactionModeChange: (mode: RedactionMode) => void;
  useReasoner: boolean;
  onUseReasonerChange: (value: boolean) => void;
}

const FRAMEWORKS: { name: string; color: string }[] = [
  { name: "HIPAA", color: "bg-pii" },
  { name: "GDPR", color: "bg-signal" },
  { name: "PCI-DSS", color: "bg-financial" },
  { name: "CCPA", color: "bg-other" },
  { name: "GLBA", color: "bg-success" },
];

export function Sidebar({
  redactionMode,
  onRedactionModeChange,
  useReasoner,
  onUseReasonerChange,
}: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-hairline px-5 py-6 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="mb-1.5 font-mono text-xs uppercase tracking-wider text-signal-soft">
        Redaction mode
      </div>
      <select
        value={redactionMode}
        onChange={(e) => onRedactionModeChange(e.target.value as RedactionMode)}
        className="mb-6 w-full rounded-lg border border-hairline bg-panel px-3 py-2 text-[15px] text-text-mid focus:border-signal focus:outline-none"
      >
        <option value="redact">Redact — [ENTITY_TYPE]</option>
        <option value="mask">Mask — ***-**-1234</option>
        <option value="replace">Replace — synthetic value</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-text-mid">
        <input
          type="checkbox"
          checked={useReasoner}
          onChange={(e) => onUseReasonerChange(e.target.checked)}
          className="h-4 w-4 accent-signal"
        />
        AI verification (Gemini)
      </label>
      <p className="mt-1.5 text-xs leading-relaxed text-text-dim">
        Checks each finding against its surrounding sentence to drop false
        positives and generate specific remediation guidance, plus an
        overall risk summary. Only entity types and MASKED context are
        sent — actual values never leave your device.
      </p>

      <div className="mt-8 rounded-xl border border-hairline bg-panel/60 p-4">
        <div className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-text-dim">
          <ShieldIcon className="h-3.5 w-3.5 text-signal-soft" />
          Frameworks covered
        </div>
        <div className="flex flex-col gap-1.5">
          {FRAMEWORKS.map((fw) => (
            <div key={fw.name} className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${fw.color}`} />
              <span className="font-mono text-[12px] text-text-meta">{fw.name}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
