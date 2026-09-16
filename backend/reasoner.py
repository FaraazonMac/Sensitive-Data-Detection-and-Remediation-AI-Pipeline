"""
reasoner.py
-----------
Cloud reasoning layer using Google's Gemini API (free tier).

Two responsibilities, both privacy-scoped so raw sensitive VALUES never
leave the device:

  1. explain()          — plain-English risk summary for the whole document
  2. verify_findings()  — context-aware true/false-positive judgment +
                           remediation guidance for each candidate finding

Detection itself (Presidio/GLiNER/Regex) always runs 100% locally. Only
entity types, risk levels, and MASKED text (never the actual PII value)
are sent to Gemini.

Requires a GEMINI_API_KEY in a .env file at the project root.
Get a free key at https://aistudio.google.com/apikey — no credit card
needed for the free tier (10 requests/min, 1,500/day as of mid-2026).
"""

import json
import os
import re
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError

from detector import Finding, _remediation_for

load_dotenv()

MODEL_NAME = "gemini-2.5-flash"

# Safety net for verify_findings(): catches the "This is a <type>, which is
# sensitive. <Verb> it." restatement pattern even if the prompt's quality
# bar gets ignored — falls back to the curated baseline_guidance instead.
_GENERIC_GUIDANCE_PATTERN = re.compile(
    r"^this is an?\b.*\b(sensitive|pii|phi)\b", re.IGNORECASE
)

# Retry transient errors (503 = model overloaded, 429 = rate limited)
# with exponential backoff before giving up.
RETRYABLE_CODES = {503, 429}
MAX_RETRIES = 3
BASE_DELAY_SECONDS = 2


class LocalReasoner:
    """
    Named LocalReasoner for backwards compatibility with pipeline.py —
    the reasoning step itself now runs via the Gemini API, not locally.
    """

    def __init__(self):
        self._client = None
        self._loaded = False
        self._api_key_present = False

    def load(self):
        """Initialise the Gemini client. Call once before first use."""
        if self._loaded:
            return

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print(
                "Warning: GEMINI_API_KEY not found. Add it to a .env file "
                "in the project root. Get a free key at "
                "https://aistudio.google.com/apikey"
            )
            self._api_key_present = False
        else:
            self._client = genai.Client(api_key=api_key)
            self._api_key_present = True
            print(f"Reasoner ready — using Gemini API ({MODEL_NAME})")

        self._loaded = True

    def _generate(self, prompt: str, max_tokens: int = 300) -> str:
        """Send prompt to Gemini and return response text. Retries on
        transient overload/rate-limit errors with exponential backoff."""
        if not self._api_key_present:
            return (
                "⚠ No Gemini API key configured. Add GEMINI_API_KEY to a "
                ".env file to enable AI explanations."
            )

        last_error = None

        for attempt in range(MAX_RETRIES + 1):
            try:
                response = self._client.models.generate_content(
                    model=MODEL_NAME,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.1,
                        top_p=0.9,
                        thinking_config=types.ThinkingConfig(
                            thinking_budget=0,  # off — not needed for this task
                        ),
                    ),
                )

                # Diagnostic: show why generation stopped (helps catch
                # truncation from thinking tokens eating the budget).
                if response.candidates:
                    finish_reason = response.candidates[0].finish_reason
                    print(f"[debug] finish_reason: {finish_reason}")

                if not response.text:
                    # Most commonly: safety filters blocked the response,
                    # OR max_output_tokens was hit before the model finished
                    # "thinking" and never reached its final answer.
                    reason = getattr(response, "prompt_feedback", None)
                    finish_reason = (
                        response.candidates[0].finish_reason
                        if response.candidates else None
                    )
                    return (
                        "⚠ Gemini returned an empty response. "
                        f"finish_reason={finish_reason}, prompt_feedback={reason}"
                    )

                return response.text.strip()

            except APIError as e:
                last_error = e
                code = getattr(e, "code", None)
                if code in RETRYABLE_CODES and attempt < MAX_RETRIES:
                    delay = BASE_DELAY_SECONDS * (2 ** attempt)
                    print(
                        f"Gemini returned {code}, retrying in {delay}s "
                        f"(attempt {attempt + 1}/{MAX_RETRIES})..."
                    )
                    time.sleep(delay)
                    continue
                return f"⚠ Gemini API error: {e}"

            except Exception as e:
                return f"⚠ Reasoner error: {e}"

        return f"⚠ Gemini API error after {MAX_RETRIES} retries: {last_error}"

    def explain(
        self,
        findings: list[Finding],
        compliance_rules: list[dict],
        text_snippet: str,
        max_new_tokens: int = 500,
    ) -> str:
        """Generate a plain-English risk explanation grounded in findings."""
        if not self._loaded:
            self.load()

        if not findings:
            return "No sensitive data was detected in this document."

        high_risk = [f for f in findings if f.risk == "High"]
        finding_lines = "\n".join(
            f"  - {f.entity_type} ({f.category}, {f.risk} risk)"
            for f in findings[:12]
        )
        frameworks = list({r["framework"] for r in compliance_rules})
        rule_lines = "\n".join(
            f"  - [{r['framework']}] {r['rule']}"
            for r in compliance_rules[:5]
        )

        prompt = f"""You are a privacy compliance assistant. Be concise, specific, and factual. This is not legal advice — frame remediation as a suggestion, not a directive.

DOCUMENT SNIPPET (for context only):
{text_snippet[:500]}

DETECTED SENSITIVE DATA ({len(findings)} items, {len(high_risk)} high-risk):
{finding_lines}

APPLICABLE COMPLIANCE RULES:
{rule_lines}

RELEVANT FRAMEWORKS: {", ".join(frameworks)}

In exactly 3 sentences:
1. Summarise the overall privacy risk of this document.
2. Highlight the single most critical finding and why it matters.
3. Suggest one concrete remediation action.

Response:"""

        return self._generate(prompt, max_tokens=max_new_tokens)

    def explain_finding(self, finding: Finding, max_new_tokens: int = 250) -> str:
        """Generate a focused explanation for a single finding."""
        if not self._loaded:
            self.load()

        prompt = f"""In 2 sentences, explain why '{finding.entity_type}' ({finding.category}, {finding.risk} risk) is sensitive and which regulation typically governs it.

Response:"""
        return self._generate(prompt, max_tokens=max_new_tokens)

    def verify_findings(
        self,
        findings: list[Finding],
        text: str,
        context_window: int = 60,
    ) -> dict[str, dict]:
        """
        Context-aware verification pass.

        Local detectors (Presidio/GLiNER/regex) classify tokens in
        isolation — "Seaborn" looks like a capitalized proper noun, so a
        general NER model tags it PERSON, with no awareness that the
        surrounding sentence is a tech-stack list. This pass fixes that by
        giving Gemini the surrounding SENTENCE for each finding and asking
        it to judge, in context, whether the candidate is a genuine
        occurrence of that entity type or a false positive — and for
        genuine findings, to generate a specific remediation.

        PRIVACY: the candidate's actual VALUE is never sent — it's replaced
        with a placeholder in the context window, and every OTHER finding
        in that same window is also masked, so no real value (the
        candidate's or a neighbor's) reaches the network. Only entity
        types and non-sensitive surrounding language leave the device.

        Fails closed on any error: returns {} and the caller falls back to
        the static detector output (denylist etc.) rather than blocking
        the scan or, worse, silently trusting an unparsed response.

        Returns: {finding_id: {"is_sensitive": bool, "remediation_type":
                  "redact"|"mask"|"tokenize", "guidance": str}}
        """
        if not self._loaded:
            self.load()
        if not self._api_key_present or not findings:
            return {}

        sorted_findings = sorted(findings, key=lambda f: f.start)
        candidates = []

        for f in sorted_findings:
            win_start = max(0, f.start - context_window)
            win_end = min(len(text), f.end + context_window)
            window = text[win_start:win_end]

            # Mask every finding that falls inside this window — the
            # candidate gets a distinguishable marker, every other finding
            # (a neighbor) gets a generic tag. Applied right-to-left so
            # earlier offsets in the window stay valid as replacements
            # change length.
            spans = []
            for other in sorted_findings:
                if other.end <= win_start or other.start >= win_end:
                    continue
                local_start = max(0, other.start - win_start)
                local_end = min(len(window), other.end - win_start)
                tag = (
                    f"<<CANDIDATE:{other.entity_type}>>"
                    if other.id == f.id
                    else "[REDACTED]"
                )
                spans.append((local_start, local_end, tag))

            chars = list(window)
            for start, end, tag in sorted(spans, key=lambda s: s[0], reverse=True):
                chars[start:end] = list(tag)

            baseline_guidance, baseline_action = _remediation_for(f.entity_type)

            candidates.append({
                "id": f.id,
                "entity_type": f.entity_type,
                "category": f.category,
                "context": "".join(chars),
                "baseline_guidance": baseline_guidance,
                "baseline_action": baseline_action,
            })

        prompt = f"""You are a privacy classifier and remediation advisor. You are NOT shown the actual sensitive values — only masked context — because raw values must never leave the user's device.

For each candidate below, the span marked <<CANDIDATE:TYPE>> is what a local detector flagged as that entity type. Judge from the surrounding text ONLY whether it is a genuine instance of that type in this context, or a false positive — e.g. a tool/library/product name, a field label used descriptively rather than an actual value, or generic vocabulary that happens to match the label semantically.

Each candidate also includes `baseline_guidance` — a pre-written, specific protection recommendation for that entity type. Your job for genuine findings is to REFINE this baseline using the specific context, not discard it for something generic. Only diverge from it when the context reveals something the generic baseline misses (e.g. the context implies a stricter rule, a specific storage/sharing nuance, or an unusual sensitivity level).

GUIDANCE QUALITY BAR — this is the most important part:
- BAD (never write this): "This is a person's name in a resume, which is sensitive PII. Redact it." — this just restates the entity type and category back at the reader. It gives no new information and is worthless as advice.
- GOOD: "Mask or pseudonymize the name before sharing outside a need-to-know group — resumes with full names are commonly cross-referenced with other leaked datasets." — concrete action, plus a specific reason tied to this context.
- GOOD: "Redact to city/state level only — full address combined with a date of birth elsewhere in the document is a HIPAA safe-harbor violation." — ties the action to something specific found in this document.
- If you have nothing context-specific to add, just return `baseline_guidance` as-is rather than inventing a weaker generic sentence.

CANDIDATES:
{json.dumps(candidates, indent=2)}

Respond with ONLY a JSON array, one object per candidate, same order, no other text:
[{{"id": "<the id>", "is_sensitive": true or false, "remediation_type": "redact" or "mask" or "tokenize", "guidance": "either baseline_guidance verbatim, or a refined version that is at least as specific and concrete — never a generic restatement. Empty string if is_sensitive is false."}}]"""

        # Map id -> curated baseline guidance, for the quality-safety-net below.
        baseline_by_id = {c["id"]: c["baseline_guidance"] for c in candidates}

        try:
            raw = self._generate_json(prompt, max_tokens=max(500, len(candidates) * 90))
            parsed = json.loads(raw)
            verdicts = {}
            for item in parsed:
                if not isinstance(item, dict) or "id" not in item:
                    continue
                item_id = item["id"]
                guidance = (item.get("guidance") or "").strip()
                is_sensitive = bool(item.get("is_sensitive", True))

                # Safety net: if the prompt's quality bar got ignored and
                # Gemini wrote a generic "this is sensitive, redact it"
                # restatement (or nothing at all), use the curated
                # baseline instead of showing the user weak advice.
                if is_sensitive and (
                    not guidance
                    or len(guidance) < 20
                    or _GENERIC_GUIDANCE_PATTERN.match(guidance)
                ):
                    guidance = baseline_by_id.get(item_id, guidance)

                verdicts[item_id] = {
                    "is_sensitive": is_sensitive,
                    "remediation_type": item.get("remediation_type") or "redact",
                    "guidance": guidance,
                }
            return verdicts
        except Exception as e:
            print(f"[verifier] falling back to static detection — {e}")
            return {}

    def _generate_json(self, prompt: str, max_tokens: int) -> str:
        """Like _generate, but requests a structured JSON response and
        raises on failure instead of returning an error string — the
        caller (verify_findings) treats any exception as 'no verdict,
        fall back to static detection', so a silent string like the
        prose _generate() returns would be misread as valid JSON input."""
        if not self._api_key_present:
            raise RuntimeError("No Gemini API key configured.")

        last_error = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = self._client.models.generate_content(
                    model=MODEL_NAME,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.1,
                        response_mime_type="application/json",
                        thinking_config=types.ThinkingConfig(thinking_budget=0),
                    ),
                )
                if not response.text:
                    finish_reason = (
                        response.candidates[0].finish_reason if response.candidates else None
                    )
                    raise RuntimeError(f"Empty response, finish_reason={finish_reason}")
                return response.text.strip()

            except APIError as e:
                last_error = e
                code = getattr(e, "code", None)
                if code in RETRYABLE_CODES and attempt < MAX_RETRIES:
                    time.sleep(BASE_DELAY_SECONDS * (2 ** attempt))
                    continue
                raise

        raise RuntimeError(f"Gemini API error after {MAX_RETRIES} retries: {last_error}")
