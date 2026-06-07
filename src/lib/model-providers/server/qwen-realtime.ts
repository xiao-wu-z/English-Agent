import {
  RealtimeProviderError,
  type RealtimeModelProvider,
} from "../realtime-types.ts";
import type { ProviderEnv } from "./registry.ts";
import {
  DEFAULT_QWEN_REALTIME_MODEL,
  createQwenRealtimeWebSocketProvider,
  resolveQwenRealtimeConfig as resolveQwenRealtimeWebSocketConfig,
} from "./qwen-realtime-websocket.ts";

export { DEFAULT_QWEN_REALTIME_MODEL };

export function resolveQwenRealtimeConfig(env: ProviderEnv = {}) {
  const apiKey = env.DASHSCOPE_API_KEY ?? env.QWEN_API_KEY;
  if (!apiKey) {
    throw new RealtimeProviderError({
      code: "missing_api_key",
      providerName: "qwen",
      message: "Qwen realtime provider requires DASHSCOPE_API_KEY or QWEN_API_KEY",
    });
  }
  return resolveQwenRealtimeWebSocketConfig(env).publicConfig;
}

export function createQwenRealtimeProvider(env: ProviderEnv = {}): RealtimeModelProvider {
  return createQwenRealtimeWebSocketProvider(env);
}
