---
name: english-correction
description: Produce restrained realtime corrections and complete post-session corrections for English speaking practice.
version: "0.1.0"
---

# Purpose

Use this skill to decide whether a learner issue should become a correction, when it should be displayed, and how it should be explained. The correction style is "少而准": useful, high-confidence, and not disruptive.

# When To Use

Use this skill after a learner turn for possible after-turn lightweight correction, and at the end of the session for complete correction review.

# Inputs

- `scenario`: context and learner goal.
- `learnerTurn`: the learner's text and optional audio-derived signals.
- `candidateIssues`: possible issues from practice or assessment.
- `assessmentResult`: confidence, evidence, and risk labels.
- `displayMode`: `after_turn`, `summary`, or both.

# Required Process

1. Decide whether the issue is a real learning error, an expression upgrade, or only a style preference.
2. Prefer high-value corrections that improve communication in the scenario.
3. For after-turn display, allow at most one correction.
4. For after-turn display, require high confidence and at least medium severity or clear usefulness.
5. Never interrupt the learner's speech.
6. For summary display, include useful corrections grouped by learning value.
7. Explain the correction briefly and in learner-friendly language.
8. If uncertain, suppress realtime display or flag for summary review.

# Output Contract

The skill produces `CorrectionItem`:

```ts
{
  id: string;
  turnId: string;
  type: "grammar" | "vocabulary" | "pronunciation_clarity" | "expression" | "coherence";
  original: string;
  corrected: string;
  explanation: string;
  severity: "minor" | "medium" | "major";
  displayTiming: "after_turn" | "summary";
  confidenceLabel: "high" | "medium" | "low";
  action: "show" | "suppress" | "flag_for_summary";
}
```

# Quality Gates

- After-turn corrections must be high confidence.
- After-turn corrections must be limited to one per learner turn.
- Low-confidence corrections must not be shown in realtime.
- Corrections must include both a better sentence and a reason.
- Style preferences must be labeled as expression upgrades, not hard grammar errors.

# Prohibited Behavior

- Do not interrupt speech.
- Do not show multiple realtime corrections for one turn.
- Do not correct accents unless intelligibility is affected.
- Do not say a sentence is wrong when it is only less natural.
- Do not fabricate what the learner said.
- Do not expose internal reasoning.

# Failure Handling

- If the original text is unavailable, do not emit a correction.
- If confidence is low, return `action: "suppress"` or `action: "flag_for_summary"`.
- If the issue is pronunciation-related but no audio signal exists, lower confidence and avoid precise pronunciation claims.

# Examples

After-turn correction:

```json
{
  "id": "correction-1",
  "turnId": "turn-1",
  "type": "expression",
  "original": "I want chicken.",
  "corrected": "I'd like the chicken, please.",
  "explanation": "This is more polite and natural when ordering in a restaurant.",
  "severity": "medium",
  "displayTiming": "after_turn",
  "confidenceLabel": "high",
  "action": "show"
}
```
