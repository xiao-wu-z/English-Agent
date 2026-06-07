import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractJsonObject,
  MockTextProvider,
  parseAndValidateProviderOutput,
  resolveTextProvider,
} from "./server/index.ts";

describe("model providers", () => {
  it("defaults to mock and returns schema-valid structured output", async () => {
    const provider = resolveTextProvider({});
    assert.equal(provider.name, "mock");
    const result = await provider.generateJson({
      messages: [{ role: "user", content: "reply" }],
      expectedOutputSchemaName: "practiceTurnGuidance",
    });
    assert.equal(result.providerName, "mock");
    assert.equal(result.parsed.shouldContinue, true);
  });

  it("extracts and validates JSON while rejecting invalid output", () => {
    assert.deepEqual(extractJsonObject("prefix {\"a\":1} suffix"), { a: 1 });
    assert.throws(
      () => parseAndValidateProviderOutput("not json", "practiceTurnGuidance"),
      /invalid_json/,
    );
    assert.throws(
      () => parseAndValidateProviderOutput("{}", "practiceTurnGuidance"),
      /schema_validation_failed/,
    );
  });

  it("rejects missing qwen key and unknown providers safely", () => {
    assert.throws(() => resolveTextProvider({ MODEL_PROVIDER: "unknown" }), /unsupported_provider/);
    assert.throws(() => resolveTextProvider({ MODEL_PROVIDER: "qwen" }), /missing_api_key/);
    assert.equal(new MockTextProvider().name, "mock");
  });
});
