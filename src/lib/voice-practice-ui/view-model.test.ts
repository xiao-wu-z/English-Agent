import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDifficultyLabel,
  getPrimaryVoiceAction,
  getReportScoreRows,
  isScenarioSelectionLocked,
} from "./view-model.ts";

describe("voice practice view model", () => {
  it("maps scenario difficulty to Chinese labels", () => {
    assert.equal(getDifficultyLabel("beginner"), "入门");
    assert.equal(getDifficultyLabel("intermediate"), "进阶");
    assert.equal(getDifficultyLabel("advanced"), "挑战");
  });

  it("selects a state-aware primary voice action", () => {
    assert.deepEqual(
      getPrimaryVoiceAction({
        hasSession: false,
        isRecording: false,
        isEnding: false,
      }),
      { id: "start_session", label: "开始语音练习", disabled: false },
    );
    assert.equal(
      getPrimaryVoiceAction({
        hasSession: true,
        isRecording: true,
        isEnding: false,
      }).label,
      "停止并发送",
    );
    assert.equal(
      getPrimaryVoiceAction({
        hasSession: true,
        isRecording: false,
        isEnding: true,
      }).disabled,
      true,
    );
  });

  it("locks scenario selection while a session is active", () => {
    assert.equal(isScenarioSelectionLocked("listening"), true);
    assert.equal(isScenarioSelectionLocked("thinking"), true);
    assert.equal(isScenarioSelectionLocked("idle"), false);
    assert.equal(isScenarioSelectionLocked("completed"), false);
  });

  it("formats report dimension scores", () => {
    const rows = getReportScoreRows({
      fluency: 80,
      pronunciationClarity: 78,
      grammar: 82,
      vocabulary: 84,
      expression: 83,
      coherence: 85,
    });

    assert.deepEqual(rows[0], { label: "流利度", score: 80 });
    assert.deepEqual(rows.at(-1), { label: "连贯性", score: 85 });
  });
});
