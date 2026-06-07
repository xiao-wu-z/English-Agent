---
name: english-summary
description: Generate a structured post-session report from transcript, assessment, and corrections.
version: "0.1.0"
---

# Purpose

Use this skill to produce the learner's post-session report. The summary must be specific, actionable, and grounded in transcript, assessment, and correction evidence.

# When To Use

Use this skill when a practice session ends or when the user requests a report for the current session.

# Inputs

- `session`: scenario ID, skill IDs, duration, status, and timestamps.
- `scenario`: title, setting, roles, and learner goals.
- `transcript`: learner and assistant turns.
- `assessmentResults`: turn-level and session-level assessment data.
- `corrections`: correction items selected for summary display.

# Required Process

1. Confirm enough transcript exists to summarize.
2. Aggregate assessment dimensions into an overall learning score.
3. Identify strengths using concrete evidence.
4. Identify priority issues that matter most for the learner's next practice.
5. Include corrected sentences with original, corrected, and reason.
6. Recommend scenario-appropriate expressions.
7. Suggest next practice actions that are specific and achievable.
8. Add a disclaimer that scores are internal learning feedback, not official exam results.

# Output Contract

The skill produces `PracticeSummary`:

```ts
{
  sessionId: string;
  overallScore: number;
  dimensionScores: {
    fluency: number;
    pronunciationClarity: number;
    grammar: number;
    vocabulary: number;
    expression: number;
    coherence: number;
  };
  strengths: string[];
  priorityIssues: string[];
  correctedSentences: CorrectionItem[];
  recommendedExpressions: string[];
  nextPracticeSuggestions: string[];
  disclaimer: string;
}
```

# Quality Gates

- Every priority issue must map to transcript, assessment, or correction evidence.
- Recommended expressions must fit the scenario.
- The report must be concise enough for a learner to act on.
- Scores must use the internal 0-100 scale.
- The disclaimer must state that scores are not official exam results.

# Prohibited Behavior

- Do not invent transcript content.
- Do not give vague encouragement without evidence.
- Do not claim official IELTS, TOEFL, CEFR, or certified pronunciation scoring.
- Do not include hidden chain-of-thought.
- Do not overwhelm the learner with every minor issue.

# Failure Handling

- If transcript is too short, generate a limited report and mark confidence low in the source assessment.
- If assessment data is missing, summarize observable transcript patterns and avoid detailed scoring claims.
- If correction data is missing, omit corrected sentences rather than inventing them.

# Examples

Output:

```json
{
  "sessionId": "session-1",
  "overallScore": 82,
  "dimensionScores": {
    "fluency": 80,
    "pronunciationClarity": 76,
    "grammar": 84,
    "vocabulary": 78,
    "expression": 82,
    "coherence": 85
  },
  "strengths": ["You stayed in the restaurant scenario and answered quickly."],
  "priorityIssues": ["Use more polite ordering expressions."],
  "correctedSentences": [],
  "recommendedExpressions": ["I'd like to order...", "Could I have...?"],
  "nextPracticeSuggestions": ["Practice ordering a main dish and asking about ingredients."],
  "disclaimer": "Scores are internal learning feedback and are not official exam results."
}
```
