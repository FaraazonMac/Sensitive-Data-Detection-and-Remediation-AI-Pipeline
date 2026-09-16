import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { TextInput } from "./TextInput";
import { FileUpload } from "./FileUpload";
import { ScanButton } from "./ScanButton";
import { LayersIcon, UploadIcon } from "@/components/ui/Icons";

export type InputMode = "text" | "file";

interface InputPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onScan: () => void;
  loading: boolean;
}

export function InputPanel({
  text,
  onTextChange,
  file,
  onFileChange,
  onScan,
  loading,
}: InputPanelProps) {
  const [mode, setMode] = useState<InputMode>("text");

  const canScan = mode === "text" ? text.trim().length > 0 : file !== null;

  return (
    <Card>
      <CardHeader title="Input" meta={mode === "text" ? "text" : "file"} />
      <CardBody>
        <div className="mb-4 flex gap-1 rounded-lg border border-hairline bg-panel-hover p-1">
          {(["text", "file"] as InputMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-all ${
                mode === m
                  ? "bg-signal-bg text-signal-soft shadow-[0_0_0_1px] shadow-signal-border"
                  : "text-text-dim hover:text-text-mid"
              }`}
            >
              {m === "text" ? <LayersIcon className="h-3.5 w-3.5" /> : <UploadIcon className="h-3.5 w-3.5" />}
              {m === "text" ? "Paste text" : "Upload file"}
            </button>
          ))}
        </div>

        {mode === "text" ? (
          <TextInput value={text} onChange={onTextChange} />
        ) : (
          <FileUpload file={file} onChange={onFileChange} />
        )}

        <ScanButton onClick={onScan} disabled={!canScan} loading={loading} />
      </CardBody>
    </Card>
  );
}
