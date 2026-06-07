import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  appendBadcaseSignal,
  getBadcaseFilePath,
  getRelevantBadcaseHints,
  readBadcaseSignals,
  toBadcaseHint,
} from "./index.ts";

const signal = {
  id: "badcase-1",
  kind: "provider_schema_failure",
  status: "candidate",
  source: "system",
  sessionId: "session-1",
  scenarioId: "job-interview",
  scenarioVersion: "1.0.0",
  skillId: "english-summary",
  createdAt: "2026-06-07T00:00:00.000Z",
  inputSnapshot: {
    lesson: "Validate structured output before displaying it.",
    avoidPattern: "Showing schema-invalid text.",
    suggestedBehavior: "Retry once, then suppress and log.",
  },
};

describe("file badcase log", () => {
  it("appends, reads, maps files, and returns prompt-safe hints", async () => {
    const root = await mkdtemp(join(tmpdir(), "english-agent-badcases-"));
    assert.equal(getBadcaseFilePath("provider_schema_failure", root).endsWith("provider.jsonl"), true);
    await appendBadcaseSignal(signal, { root });
    const signals = await readBadcaseSignals("provider_schema_failure", { root });
    assert.equal(signals.length, 1);
    const hint = toBadcaseHint(signals[0]);
    assert.equal(hint.sourceSignalId, "badcase-1");
    assert.equal("inputSnapshot" in hint, false);
    const hints = await getRelevantBadcaseHints({
      root,
      scenarioId: "job-interview",
      skillId: "english-summary",
      limit: 1,
    });
    assert.equal(hints.length, 1);
  });

  it("throws clear errors for invalid JSONL", async () => {
    const root = await mkdtemp(join(tmpdir(), "english-agent-badcases-"));
    const path = getBadcaseFilePath("provider_schema_failure", root);
    await writeFile(path, "{bad json}\n", "utf8");
    await assert.rejects(
      () => readBadcaseSignals("provider_schema_failure", { root }),
      /Invalid JSONL/,
    );
  });
});
