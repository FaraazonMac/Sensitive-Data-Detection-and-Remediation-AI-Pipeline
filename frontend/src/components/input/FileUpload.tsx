import { useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = ["txt", "pdf", "png", "jpg", "jpeg", "bmp", "tiff"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB — adjust to match backend limit

interface FileUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

export function FileUpload({ file, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function validateAndSet(selected: File | null) {
    setError(null);
    if (!selected) {
      onChange(null);
      return;
    }
    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type: .${ext}`);
      onChange(null);
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError("File exceeds 20MB limit.");
      onChange(null);
      return;
    }
    onChange(selected);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          validateAndSet(e.dataTransfer.files[0] ?? null);
        }}
        className="cursor-pointer rounded-lg border border-dashed border-hairline bg-panel-hover px-4 py-10 text-center transition-colors hover:border-signal"
      >
        <p className="text-sm text-text-mid">Drop a file here, or click to browse</p>
        <p className="mt-1 font-mono text-xs text-text-dim">
          {ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(" · ")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </div>

      {file && !error && (
        <div className="mt-2 font-mono text-[15px] text-success-soft">
          ✓ {file.name} · {file.size.toLocaleString()} bytes
        </div>
      )}
      {error && <div className="mt-2 text-sm text-pii">{error}</div>}
    </div>
  );
}
