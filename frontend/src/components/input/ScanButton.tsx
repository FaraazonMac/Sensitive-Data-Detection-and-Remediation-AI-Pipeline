import { ScanLineIcon } from "@/components/ui/Icons";

interface ScanButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

export function ScanButton({ onClick, disabled, loading }: ScanButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-signal-deep to-signal py-2.5 text-[15px] font-semibold text-text-bright shadow-[0_4px_20px_rgba(99,102,241,0.25)] transition-all duration-200 hover:shadow-[0_4px_24px_rgba(99,102,241,0.4)] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100"
    >
      <ScanLineIcon className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
      {loading ? "Scanning…" : "Scan document"}
    </button>
  );
}
