import {
  RealtimeProviderError,
  type RealtimeModelProvider,
} from "../realtime-types.ts";
import type { ProviderEnv } from "./registry.ts";
import { createQwenRealtimeProvider } from "./qwen-realtime.ts";
import { MockRealtimeProvider } from "./realtime-mock.ts";

export function resolveRealtimeProvider(
  env: ProviderEnv = {},
): RealtimeModelProvider {
  const provider = env.MODEL_PROVIDER ?? "mock";
  if (provider === "mock") {
    return new MockRealtimeProvider();
  }
  if (provider === "qwen") {
    return createQwenRealtimeProvider(env);
  }
  throw new RealtimeProviderError({
    code: "unsupported_provider",
    providerName: provider,
    message: `Unsupported realtime provider: ${provider}`,
  });
}
