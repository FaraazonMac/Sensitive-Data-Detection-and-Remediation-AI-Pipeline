import { useState } from "react";
import type { ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs, defaultTabId }: { tabs: TabDef[]; defaultTabId?: string }) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-hairline px-5 pt-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active?.id}
            onClick={() => setActiveId(tab.id)}
            className={`rounded-t-md px-3 py-2 text-[14px] font-medium transition-colors ${
              tab.id === active?.id
                ? "border-b-2 border-signal text-text-bright"
                : "text-text-dim hover:text-text-mid"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="p-5">
        {active?.content}
      </div>
    </div>
  );
}
