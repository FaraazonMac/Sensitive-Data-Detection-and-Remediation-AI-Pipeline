"""
core/redactor.py
----------------
Takes detected findings and applies redaction strategies:

  - REDACT   : Replace with [ENTITY_TYPE] placeholder
  - MASK     : Replace with *** keeping length (e.g. ***-**-1234 for SSN)
  - REPLACE  : Substitute with a fake synthetic value
  - HIGHLIGHT: Return HTML with colour-coded spans (for UI preview)

Uses Presidio Anonymizer for REDACT/MASK/REPLACE,
and custom logic for the HIGHLIGHT HTML view.
"""

import hashlib
from dataclasses import dataclass
from typing import Literal

from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import (
    RecognizerResult,
    OperatorConfig,
)
from presidio_analyzer.recognizer_result import RecognizerResult as AnalyzerResult

from detector import Finding


# ---------------------------------------------------------------------------
# Colour coding for highlight view
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Colour coding for highlight view — by RISK LEVEL, not category.
#   High risk (the actual sensitive PII/PHI/Financial data)  -> red
#   Medium risk (lesser-confidential data)                    -> yellow
#   Low risk / anything else                                 -> green
# ---------------------------------------------------------------------------

# Entity types where a full mask destroys useful shape for the reader —
# keep the last 4 characters visible (standard practice for card/account/
# phone numbers), full-mask everything else.
KEEP_LAST4 = {
    "US_SSN", "CREDIT_CARD", "US_BANK_NUMBER", "IBAN_CODE", "ROUTING_NUMBER",
    "PHONE_NUMBER", "PHONE_NUMBER_IN", "PAN", "AADHAAR",
}

RISK_COLOURS = {
    "High":   {"bg": "#fee2e2", "text": "#991b1b", "border": "#fca5a5"},  # red
    "Medium": {"bg": "#fef9c3", "text": "#854d0e", "border": "#fde047"},  # yellow
    "Low":    {"bg": "#dcfce7", "text": "#166534", "border": "#86efac"},  # green
}


# ---------------------------------------------------------------------------
# Redactor
# ---------------------------------------------------------------------------

class Redactor:
    def __init__(self):
        self._engine = AnonymizerEngine()

    def redact(
        self,
        text: str,
        findings: list[Finding],
        mode: Literal["redact", "mask", "replace", "tokenize"] = "redact",
    ) -> str:
        """
        Apply redaction to text using Presidio Anonymizer.
        Returns the anonymized string.
        """
        if not findings:
            return text

        if mode == "tokenize":
            # Deterministic pseudonymization — same value always maps to
            # the same token (referential integrity across a document),
            # without needing a Presidio custom-operator registration.
            return self._tokenize(text, findings)

        # Convert Finding objects → Presidio RecognizerResult objects
        analyzer_results = [
            AnalyzerResult(
                entity_type=f.entity_type,
                start=f.start,
                end=f.end,
                score=f.score,
            )
            for f in findings
        ]

        if mode == "redact":
            operators = {"DEFAULT": OperatorConfig("replace", {"new_value": "[REDACTED]"})}
            # Use entity-specific placeholders
            for f in findings:
                operators[f.entity_type] = OperatorConfig(
                    "replace", {"new_value": f"[{f.entity_type}]"}
                )

        elif mode == "mask":
            operators = {
                "DEFAULT": OperatorConfig("mask", {
                    "type": "mask",
                    "masking_char": "*",
                    "chars_to_mask": 999,
                    "from_end": False,
                })
            }
            # For SSN, keep last 4 digits
            operators["US_SSN"] = OperatorConfig("mask", {
                "type": "mask",
                "masking_char": "*",
                "chars_to_mask": 7,
                "from_end": False,
            })
            # For credit cards, keep last 4
            operators["CREDIT_CARD"] = OperatorConfig("mask", {
                "type": "mask",
                "masking_char": "*",
                "chars_to_mask": 12,
                "from_end": False,
            })

        elif mode == "replace":
            operators = {
                "DEFAULT":        OperatorConfig("replace", {"new_value": "[SYNTHETIC]"}),
                "PERSON":         OperatorConfig("replace", {"new_value": "Jane Smith"}),
                "EMAIL_ADDRESS":  OperatorConfig("replace", {"new_value": "user@example.com"}),
                "PHONE_NUMBER":   OperatorConfig("replace", {"new_value": "+1-555-000-0000"}),
                "US_SSN":         OperatorConfig("replace", {"new_value": "000-00-0000"}),
                "CREDIT_CARD":    OperatorConfig("replace", {"new_value": "4111-1111-1111-1111"}),
                "LOCATION":       OperatorConfig("replace", {"new_value": "123 Example St"}),
                "DATE_TIME":      OperatorConfig("replace", {"new_value": "01/01/1900"}),
            }
        else:
            raise ValueError(f"Unknown redaction mode: {mode}")

        result = self._engine.anonymize(
            text=text,
            analyzer_results=analyzer_results,
            operators=operators,
        )
        return result.text

    def remediate(self, text: str, applied: list[tuple[Finding, str]]) -> str:
        """
        Apply a MIX of per-finding actions (redact/mask/tokenize) in a
        single pass over `text`.

        This is deliberately separate from `redact()` above: `redact()`
        applies one mode to every finding via Presidio's anonymizer, which
        is right for the bulk redacted/masked outputs. One-click per-finding
        remediation needs different findings to get different actions in
        the same document, and — critically — always recomputes from the
        ORIGINAL text using every finding applied so far, rather than
        re-applying to already-modified text. Replacement strings are a
        different length than the originals, so sequential edits on
        already-edited text would silently corrupt every subsequent
        finding's offsets; recomputing from the original each time avoids
        that entirely.
        """
        if not applied:
            return text

        sorted_applied = sorted(applied, key=lambda pair: pair[0].start, reverse=True)
        chars = list(text)
        for finding, mode in sorted_applied:
            replacement = self._apply_single(finding.value, finding.entity_type, mode)
            chars[finding.start:finding.end] = list(replacement)
        return "".join(chars)

    @staticmethod
    def _apply_single(value: str, entity_type: str, mode: str) -> str:
        if mode == "tokenize":
            return Redactor._token_for(value, entity_type)
        if mode == "mask":
            if entity_type in KEEP_LAST4 and len(value) > 4:
                return "*" * (len(value) - 4) + value[-4:]
            return "*" * len(value)
        # default: redact
        return f"[{entity_type}]"

    def _tokenize(self, text: str, findings: list[Finding]) -> str:
        """Replace each finding's span with a deterministic pseudonymous
        token — [ENTITY_TYPE_XXXXXXXX], hashed from the original value so
        repeated occurrences of the same value collapse to the same token."""
        sorted_findings = sorted(findings, key=lambda f: f.start, reverse=True)
        chars = list(text)
        for f in sorted_findings:
            chars[f.start:f.end] = list(self._token_for(f.value, f.entity_type))
        return "".join(chars)

    @staticmethod
    def _token_for(value: str, entity_type: str) -> str:
        digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:8].upper()
        return f"[{entity_type}_{digest}]"

    def highlight_html(self, text: str, findings: list[Finding]) -> str:
        """
        Return HTML string with sensitive findings wrapped in
        colour-coded <span> tags. Used for the Streamlit preview.
        """
        if not findings:
            return f"<pre style='white-space:pre-wrap;word-break:break-word;'>{_escape(text)}</pre>"

        # Sort by position descending so we can insert HTML without shifting offsets
        sorted_findings = sorted(findings, key=lambda f: f.start, reverse=True)

        chars = list(text)

        for f in sorted_findings:
            colours = RISK_COLOURS.get(f.risk, RISK_COLOURS["Low"])
            original = text[f.start:f.end]
            span = (
                f'<span style="background:{colours["bg"]};color:{colours["text"]};'
                f'border:1px solid {colours["border"]};border-radius:3px;'
                f'padding:1px 4px;font-weight:600;cursor:pointer;" '
                f'title="{f.entity_type} | {f.category} | {f.risk} risk | via {f.source}">'
                f'{_escape(original)}'
                f'</span>'
            )
            chars[f.start:f.end] = list(span)

        highlighted = "".join(chars)
        return (
            f"<pre style='white-space:pre-wrap;word-break:break-word;"
            f"font-family:monospace;font-size:13px;line-height:1.8;'>"
            f"{highlighted}</pre>"
        )

    def redact_structured(
        self,
        data: dict | list,
        findings: list[Finding],
        source_text: str,
        mode: str = "redact",
    ) -> dict | list:
        """
        For JSON/structured input: redact the source text and
        re-parse it back. Best-effort — returns redacted text
        if re-parsing fails.
        """
        redacted_text = self.redact(source_text, findings, mode)
        import json
        try:
            return json.loads(redacted_text)
        except Exception:
            return redacted_text


def _escape(text: str) -> str:
    return (
        text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
