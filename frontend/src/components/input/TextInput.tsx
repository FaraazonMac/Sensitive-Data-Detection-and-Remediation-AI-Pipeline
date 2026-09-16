import { SAMPLES } from "./samples";

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function TextInput({ value, onChange }: TextInputProps) {
  return (
    <div>
      <select
        onChange={(e) => e.target.value && onChange(SAMPLES[e.target.value] ?? "")}
        defaultValue=""
        className="mb-3 w-full rounded-lg border border-hairline bg-panel px-3 py-2 text-sm text-text-mid focus:border-signal focus:outline-none"
      >
        <option value="">— select sample —</option>
        {Object.keys(SAMPLES).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="// paste any text, JSON, CSV, or document content..."
        rows={11}
        className="w-full resize-none rounded-lg border border-hairline bg-panel-hover p-3 font-mono text-sm text-text-mid placeholder:text-text-dim focus:border-signal focus:outline-none"
      />
    </div>
  );
}
