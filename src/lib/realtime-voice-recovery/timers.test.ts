import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createVoiceRecoveryTimerRegistry,
  mapTimeoutToRecoveryReason,
} from "./index.ts";

describe("voice recovery timers", () => {
  it("maps timeout types to recovery reasons", () => {
    assert.equal(
      mapTimeoutToRecoveryReason("sse_idle_timeout"),
      "sse_idle_timeout",
    );
    assert.equal(
      mapTimeoutToRecoveryReason("no_assistant_response_timeout"),
      "assistant_response_timeout",
    );
  });

  it("starts and clears timers by key", () => {
    const cleared: string[] = [];
    const registry = createVoiceRecoveryTimerRegistry({
      setTimeout: () => 7,
      clearTimeout: (id) => cleared.push(String(id)),
    });

    registry.start("sse_idle_timeout", 1000, () => {});
    registry.start("sse_idle_timeout", 1000, () => {});
    registry.clearAll();

    assert.deepEqual(cleared, ["7", "7"]);
  });
});
