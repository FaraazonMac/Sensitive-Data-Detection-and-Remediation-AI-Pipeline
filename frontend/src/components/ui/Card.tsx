import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Base panel surface. Slightly translucent + backdrop-blurred so the
 * ambient background glow reads through at the edges, with a gradient
 * signature bar on top and a soft glow shadow for depth.
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-hairline bg-panel/90 shadow-[0_8px_30px_rgba(0,0,0,0.35),0_0_0_1px_rgba(129,140,248,0.04)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_40px_rgba(129,140,248,0.06)] ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-signal-deep via-signal to-signal-soft" />
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  meta?: string;
  dotColor?: string;
}

export function CardHeader({ title, meta, dotColor = "bg-signal" }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-text-bright">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shadow-[0_0_8px_2px] shadow-current`} />
        {title}
      </div>
      {meta && <div className="text-[13px] text-text-dim">{meta}</div>}
    </div>
  );
}

export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
