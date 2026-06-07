import type { PromptMessage } from "../prompt-context/types.ts";

export type ExpectedOutputSchemaName =
  | "practiceTurnGuidance"
  | "assessmentResult"
  | "qualityAssessment"
  | "correctionItem"
  | "practiceSummary";

export type TextGenerationRequest = {
  messages: PromptMessage[];
  expectedOutputSchemaName: ExpectedOutputSchemaName;
};

export type TextGenerationResult<T = unknown> = {
  rawText: string;
  parsed: T;
  providerName: string;
  modelName: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type TextModelProvider = {
  name: string;
  modelName: string;
  generateJson<T = unknown>(
    request: TextGenerationRequest,
  ): Promise<TextGenerationResult<T>>;
};

export type ModelProviderErrorCode =
  | "missing_api_key"
  | "http_error"
  | "invalid_json"
  | "schema_validation_failed"
  | "provider_unavailable"
  | "unsupported_provider";

export class ModelProviderError extends Error {
  public readonly code: ModelProviderErrorCode;
  public readonly providerName: string;

  constructor(
    code: ModelProviderErrorCode,
    providerName: string,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "ModelProviderError";
    this.code = code;
    this.providerName = providerName;
  }
}
