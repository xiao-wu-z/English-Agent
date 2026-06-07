import { schemaForExpectedOutput } from "./schemas.ts";
import {
  type ExpectedOutputSchemaName,
  ModelProviderError,
} from "./types.ts";

export function extractJsonObject(rawText: string): unknown {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new ModelProviderError("invalid_json", "unknown", "No JSON object found");
  }
  try {
    return JSON.parse(rawText.slice(start, end + 1));
  } catch (error) {
    throw new ModelProviderError(
      "invalid_json",
      "unknown",
      error instanceof Error ? error.message : "Invalid JSON",
    );
  }
}

export function parseAndValidateProviderOutput(
  rawText: string,
  expectedOutputSchemaName: ExpectedOutputSchemaName,
): unknown {
  const parsed = extractJsonObject(rawText);
  try {
    return schemaForExpectedOutput(expectedOutputSchemaName).parse(parsed);
  } catch (error) {
    throw new ModelProviderError(
      "schema_validation_failed",
      "unknown",
      error instanceof Error ? error.message : "Schema validation failed",
    );
  }
}
