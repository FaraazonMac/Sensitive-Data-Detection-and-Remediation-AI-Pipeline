/**
 * These types are inferred from pipeline.py's `PipelineResult` and
 * detector.py's `Finding` dataclasses, NOT copied from your actual FastAPI
 * Pydantic schema (I haven't seen it yet).
 *
 * ACTION REQUIRED: paste your `schemas/` file or a sample /scan response,
 * and diff it against this file. Pydantic's default JSON serialization
 * uses these exact field names IF your response_model re-exposes the
 * dataclass fields as-is — but if you renamed anything, or nested things
 * differently, update below accordingly.
 */

export type Category = "PII" | "PHI" | "Financial" | "Other";
export type Risk = "High" | "Medium" | "Low" | "None";
export type RedactionMode = "redact" | "mask" | "replace";
export type RemediationType = "redact" | "mask" | "tokenize";
export type FindingSource = "presidio" | "gliner" | "regex" | "manual" | string;

export interface Finding {
  entity_type: string;
  category: Category;
  value: string;
  start: number;
  end: number;
  score: number;
  risk: Risk;
  source: FindingSource;
  reason?: string;
  id?: string;
  recommended_action?: string;
  remediation_type?: RemediationType;
}

export interface ComplianceRule {
  framework: string;
  rule: string;
  description: string;
  entity_types: string[];
  risk: Risk;
  relevance: number;
}

export interface ScanSummary {
  total: number;
  categories: Record<string, number>;
  risks: Record<string, number>;
  sources: Record<string, number>;
  overall_risk: Risk | "None";
}

export interface ScanResult {
  original_text: string;
  findings: Finding[];
  summary: ScanSummary;
  compliance_rules: ComplianceRule[];
  compliance_exposure: Record<string, number>;
  explanation: string;
  redacted_text: string;
  masked_text: string;
  highlighted_html: string;
  warnings: string[];
}

export interface ScanRequestOptions {
  redaction_mode: RedactionMode;
  use_reasoner: boolean;
}
