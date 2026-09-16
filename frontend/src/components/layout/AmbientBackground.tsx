export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-signal/[0.10] blur-[120px]" />
      <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-financial/[0.07] blur-[120px]" />
      <div className="absolute -bottom-40 left-1/3 h-[480px] w-[480px] rounded-full bg-pii/[0.05] blur-[130px]" />
    </div>
  );
}
