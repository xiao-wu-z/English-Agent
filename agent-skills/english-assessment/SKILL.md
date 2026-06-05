---
name: english-assessment
description: Assess learner performance and AI response quality with structured, non-official learning scores.
version: "0.1.0"
---

# Purpose

Use this skill to evaluate speaking performance and AI response quality. The assessment must be explainable and useful for learning, but it must not present itself as an official IELTS, TOEFL, CEFR, or pronunciation certification score.

# When To Use

Use this skill after a learner turn, after an assistant turn that needs quality review, or at the end of a session.

Use it asynchronously when possible so it does not block the realtime voice conversation.

# Inputs

- `scenario`: setting, roles, learner goals, and constraints.
- `skillContext`: the practice, correction, and summary skill expectations.
- `transcriptScope`: one turn, recent turns, or the full session transcript.
- `assistantReply`: optional assistant turn to evaluate for role alignment and hallucination risk.
- `learnerAudioSignals`: optional ASR confidence, hesitation, pace, or pronunciation clarity signals.

# Required Process

1. Determine whether the scope is a turn-level or session-level assessment.
2. Score only dimensions supported by available evidence.
3. Assess learner performance: fluency, pronunciation clarity, grammar, vocabulary, coherence, and scenario relevance.
4. Assess assistant quality when applicable: role alignment, pedagogical value, correction accuracy, and hallucination risk.
5. Attach evidence using short learner-facing observations.
6. Assign `confidenceLabel` based on evidence quality.
7. Recommend one action: `none`, `suppress_correction`, `clarify_next_turn`, `flag_for_summary`, or `regenerate_private_suggestion`.
8. Do not expose hidden chain-of-thought. Output structured reasons only.

# Output Contract

The skill produces `AssessmentResult` and may produce `QualityAssessment`.

```ts
{
  scope: "turn" | "session";
  scores: {
    fluency: number;
    pronunciationClarity: number;
    grammar: number;
    vocabulary: number;
    coherence: number;
    scenarioRelevance: number;
    roleAlignment: number;
  };
  confidenceLabel: "high" | "medium" | "low";
  riskLevel: "low" | "medium" | "high";
  evidence: string[];
  recommendedAction: RecommendedAction;
}
```

# Quality Gates

- Scores must use the internal 0-100 scale.
- Scores must have evidence.
- Low evidence must lower `confidenceLabel`.
- Hallucination risk must be reported as a risk label, not as hidden reasoning.
- Official exam names may be referenced only to say the output is not an official score.

# Prohibited Behavior

- Do not reveal chain-of-thought.
- Do not invent audio-level pronunciation details when no audio signal is available.
- Do not claim official IELTS, TOEFL, CEFR, or phoneme-level scoring.
- Do not score harshly without evidence.
- Do not treat accent as an error when intelligibility is sufficient.

# Failure Handling

- If transcript evidence is too thin, return low confidence and recommend `clarify_next_turn` or `flag_for_summary`.
- If assistant feedback may be unreliable, raise hallucination risk and recommend suppressing or flagging the feedback.
- If audio signals are missing, assess pronunciation clarity only from available transcript or mark confidence low.

# Examples

Input: learner says "I want order chicken" in a restaurant scenario.

Output:

```json
{
  "scope": "turn",
  "scores": {
    "fluency": 78,
    "pronunciationClarity": 70,
    "grammar": 66,
    "vocabulary": 72,
    "coherence": 82,
    "scenarioRelevance": 95,
    "roleAlignment": 90
  },
  "confidenceLabel": "medium",
  "riskLevel": "low",
  "evidence": ["The sentence is understandable and relevant, but the verb pattern needs correction."],
  "recommendedAction": "flag_for_summary"
}
```
