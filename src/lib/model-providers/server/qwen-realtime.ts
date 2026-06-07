import {
  RealtimeProviderError,
  type RealtimeModelProvider,
} from "../realtime-types.ts";
import type { ProviderEnv } from "./registry.ts";
import { MockRealtimeProvider } from "./realtime-mock.ts";

export const DEFAULT_QWEN_REALTIME_MODEL = "qwen3.5-omni-plus-realtime";

export function resolveQwenRealtimeConfig(env: ProviderEnv = {}) {
  const apiKey = env.DASHSCOPE_API_KEY ?? env.QWEN_API_KEY;
  if (!apiKey) {
    throw new RealtimeProviderError({
      code: "missing_api_key",
      providerName: "qwen",
      message: "Qwen realtime provider requires DASHSCOPE_API_KEY or QWEN_API_KEY",
    });
  }
  return {
    providerName: "qwen",
    modelName: env.QWEN_REALTIME_MODEL ?? DEFAULT_QWEN_REALTIME_MODEL,
  };
}

export function createQwenRealtimeProvider(env: ProviderEnv = {}): RealtimeModelProvider {
  const config = resolveQwenRealtimeConfig(env);
  const provider = new MockRealtimeProvider();
  provider.name = config.providerName;
  provider.modelName = config.modelName;
  return provider;
}
