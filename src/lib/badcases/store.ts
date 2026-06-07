import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  type BadcaseHint,
  type BadcaseKind,
  type BadcaseSignal,
  badcaseHintSchema,
  badcaseSignalSchema,
} from "./schema.ts";

const DEFAULT_BADCASE_ROOT = "data/badcases";

const fileByKind: Record<BadcaseKind, string> = {
  wrong_correction: "correction.jsonl",
  user_dismissed_correction: "correction.jsonl",
  low_quality_assessment: "assessment.jsonl",
  bad_summary: "summary.jsonl",
  user_regenerated: "summary.jsonl",
  provider_schema_failure: "provider.jsonl",
};

export function getBadcaseFilePath(
  kind: BadcaseKind,
  root = DEFAULT_BADCASE_ROOT,
): string {
  return join(root, fileByKind[kind]);
}

export async function appendBadcaseSignal(
  signal: BadcaseSignal,
  options: { root?: string } = {},
): Promise<void> {
  const parsed = badcaseSignalSchema.parse(signal);
  const filePath = getBadcaseFilePath(parsed.kind, options.root);
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(parsed)}\n`, "utf8");
}

export async function readBadcaseSignals(
  kind: BadcaseKind,
  options: { root?: string } = {},
): Promise<BadcaseSignal[]> {
  const filePath = getBadcaseFilePath(kind, options.root);
  let raw = "";
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const lines = raw.split(/\r?\n/u).filter((line) => line.trim().length > 0);
  return lines.map((line, index) => {
    try {
      return badcaseSignalSchema.parse(JSON.parse(line));
    } catch (error) {
      throw new Error(`Invalid JSONL in ${filePath} at line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

export function toBadcaseHint(signal: BadcaseSignal): BadcaseHint {
  const snapshot = signal.inputSnapshot;
  return badcaseHintSchema.parse({
    kind: signal.kind,
    scenarioId: signal.scenarioId,
    skillId: signal.skillId,
    lesson: String(snapshot.lesson ?? `Review ${signal.kind}.`),
    avoidPattern: String(snapshot.avoidPattern ?? "Repeating the recorded failure."),
    suggestedBehavior: String(snapshot.suggestedBehavior ?? "Use safer, evidence-grounded behavior."),
    sourceSignalId: signal.id,
  });
}

export async function getRelevantBadcaseHints(options: {
  root?: string;
  scenarioId: string;
  skillId: string;
  kinds?: BadcaseKind[];
  limit?: number;
}): Promise<BadcaseHint[]> {
  const kinds = options.kinds ?? Object.keys(fileByKind) as BadcaseKind[];
  const signals = (await Promise.all(
    kinds.map((kind) => readBadcaseSignals(kind, { root: options.root })),
  )).flat();
  return signals
    .filter(
      (signal) =>
        signal.scenarioId === options.scenarioId &&
        signal.skillId === options.skillId &&
        signal.status !== "ignored",
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, options.limit ?? 3)
    .map(toBadcaseHint);
}
