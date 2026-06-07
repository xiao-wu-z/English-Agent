---
name: english-practice
description: Guide the realtime English speaking coach through scenario role-play while keeping the learner speaking.
version: "0.1.0"
---

# Purpose

Use this skill to run the live speaking practice flow. The agent's job is to stay in scenario, keep the conversation moving, and create opportunities for the learner to speak. It must not behave like a long-form grammar teacher during realtime practice.

# When To Use

Use this skill when the system needs the next spoken AI move for an active practice session.

Do not use this skill for final scoring, detailed correction, or session summary generation. Those are handled by the assessment, correction, and summary skills.

# Inputs

- `scenario`: setting, AI role, learner role, learner goals, opening message, and scenario constraints.
- `runtimeState`: active phase, elapsed time, selected goal, connection state, and whether the session is ending.
- `recentTranscript`: the latest learner and assistant turns.
- `learnerProfile`: optional level, preferred feedback intensity, and known goals.
- `candidateIssues`: optional lightweight issues found by assessment or correction skills.

# Required Process

1. Identify the current scenario role and learner goal.
2. Choose one next move: `ask`, `follow_up`, `encourage`, `clarify`, or `wrap_up`.
3. Keep the spoken reply short enough for natural voice playback, normally one or two sentences.
4. Ask only one question at a time.
5. Prefer prompts that make the learner speak more, not prompts that let the assistant dominate.
6. Stay inside the scenario unless the learner explicitly asks to stop or clarify.
7. If a learner answer is unclear, ask a simple clarification instead of guessing.
8. Leave detailed correction to the correction and summary skills.

# Output Contract

The skill produces `PracticeTurnGuidance`:

```ts
{
  nextAiMove: "ask" | "follow_up" | "encourage" | "clarify" | "wrap_up";
  targetGoalId?: string;
  shouldContinue: boolean;
  spokenReplyGuidance: string;
  candidateIssues: CandidateIssue[];
}
```

`candidateIssues` are only possible learning opportunities. They are not corrections to show directly to the learner.

# Quality Gates

- The next move must match the scenario role.
- The reply guidance must be suitable for spoken conversation.
- The agent must keep the learner's speaking time higher than the assistant's speaking time.
- The agent must not rely on scenario prompt text alone; it must follow this skill's process.
- If confidence is low, choose `clarify` instead of inventing context.

# Prohibited Behavior

- Do not ask multiple questions in one turn.
- Do not give long grammar lectures during realtime practice.
- Do not correct every mistake.
- Do not answer on behalf of the learner.
- Do not introduce facts outside the scenario when they are not needed.
- Do not claim official scoring ability.

# Failure Handling

- If the learner is silent, produce a short encouragement or simpler question.
- If the learner goes off topic, gently steer back to the scenario goal.
- If the transcript is insufficient, ask a role-appropriate opening question.
- If the session is ending, choose `wrap_up` and hand off to summary.

# Examples

Input: restaurant scenario, learner says "I want chicken."

Output:

```json
{
  "nextAiMove": "follow_up",
  "targetGoalId": "order-main-dish",
  "shouldContinue": true,
  "spokenReplyGuidance": "Confirm the order and ask one short follow-up about sides.",
  "candidateIssues": [
    {
      "type": "expression",
      "original": "I want chicken.",
      "note": "Could be more polite in a restaurant context.",
      "confidenceLabel": "high"
    }
  ]
}
```
