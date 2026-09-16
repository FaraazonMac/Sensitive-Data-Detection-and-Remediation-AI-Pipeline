/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Base canvas ──────────────────────────────────
        "ink-navy": "#0A0E18",
        panel: "#111729",
        "panel-hover": "#161F38",
        hairline: "#212A46",

        // ── Text ─────────────────────────────────────────
        "text-bright": "#EDF1FA",
        "text-mid": "#B7C0D8",
        "text-dim": "#6B7593",
        "text-meta": "#8B95AC",

        // ── Interactive accent (used only for controls/links,
        //    never as decoration) ───────────────────────────
        signal: "#818CF8",
        "signal-deep": "#4338CA",
        "signal-soft": "#A5B4FC",
        "signal-bg": "#1B2350",
        "signal-border": "#2D3A6E",

        // ── Category colours (functional — data classification) ──
        pii: "#F87171",
        phi: "#991B1B",
        financial: "#C084FC",
        other: "#FACC15",

        // ── Status ───────────────────────────────────────
        success: "#34D399",
        "success-soft": "#6EE7B7",

        // ── Redaction signature (the one visual flourish,
        //    literally the artifact this tool produces) ────
        redact: "#05060A",
      },
      fontFamily: {
        // No display/marketing face — this is a technical tool, not
        // a landing page. Mono carries headers/labels, Inter carries
        // reading copy.
        body: ["'Inter'", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        blueprint:
          "radial-gradient(circle, rgba(129,140,248,0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        blueprint: "22px 22px",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "redact-wipe": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        pulse: "pulse 2s ease-in-out infinite",
        "redact-wipe": "redact-wipe 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
