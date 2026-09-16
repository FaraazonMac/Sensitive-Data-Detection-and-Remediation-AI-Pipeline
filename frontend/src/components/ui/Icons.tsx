interface IconProps {
  className?: string;
}

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ScanLineIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 6V4a1 1 0 0 1 1-1h2M17 6V4a1 1 0 0 0-1-1h-2M3 14v2a1 1 0 0 0 1 1h2M17 14v2a1 1 0 0 1-1 1h-2" />
      <path d="M3 10h14" strokeDasharray="2 2" />
    </svg>
  );
}

export function EyeSearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2 10s2.7-5 8-5 8 5 8 5-2.7 5-8 5-8-5-8-5Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2.5 17.5 7 10 11.5 2.5 7 10 2.5Z" />
      <path d="M2.5 11 10 15.5 17.5 11" />
      <path d="M2.5 15 10 19.5 17.5 15" />
    </svg>
  );
}

export function EraserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7.5 17H17" />
      <path d="M13.5 3.5 17 7 8 16H4.5v-3.5L13.5 3.5Z" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2.5 16.5 5v5c0 4-2.7 6.6-6.5 7.5C6.2 16.6 3.5 14 3.5 10V5L10 2.5Z" />
    </svg>
  );
}

export function CheckShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2.5 16.5 5v5c0 4-2.7 6.6-6.5 7.5C6.2 16.6 3.5 14 3.5 10V5L10 2.5Z" />
      <path d="M7.3 10 9.2 11.9 12.7 8.4" />
    </svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 13V4M6.5 7.5 10 4l3.5 3.5" />
      <path d="M3.5 14.5V16a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-1.5" />
    </svg>
  );
}
