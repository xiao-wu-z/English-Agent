import { ModelProviderError, type TextModelProvider } from "../types.ts";
import { MockTextProvider } from "./mock.ts";

export type ProviderEnv = Record<string, string | undefined>;

export function resolveTextProvider(env: ProviderEnv = {}): TextModelProvider {
  const provider = env.MODEL_PROVIDER ?? "mock";
  if (provider === "mock") {
    return new MockTextProvider();
  }
  if (provider === "qwen") {
    const apiKey = env.QWEN_API_KEY ?? env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new ModelProviderError(
        "missing_api_key",
        "qwen",
        "Qwen provider requires QWEN_API_KEY or DASHSCOPE_API_KEY",
      );
    }
    return new MockTextProvider();
  }
  throw new ModelProviderError(
    "unsupported_provider",
    provider,
    `Unsupported provider: ${provider}`,
  );
}
