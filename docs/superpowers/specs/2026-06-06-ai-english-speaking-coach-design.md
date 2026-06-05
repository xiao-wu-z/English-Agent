# AI English Speaking Coach - Baseline Design

## Goal

Build a two-day MVP for a multi-scenario AI English speaking practice assistant. The app lets users choose a practice scenario, speak with an AI role in real time, receive voice responses, get light corrections during practice, and review a structured post-session summary. The first version uses local browser history instead of accounts or a database.

## Scope

### In Scope

- Multi-scenario selection for English speaking practice.
- Scenario definitions stored as JSON files.
- Schema validation for scenario files.
- Real-time voice input and voice output.
- AI role-play based on the selected scenario.
- Light grammar, pronunciation, and expression correction during conversation.
- Post-session summary with quantitative and qualitative feedback.
- Local practice history using `localStorage`.
- TypeScript and Next.js implementation.

### Out of Scope

- User login.
- Server-side database persistence.
- Admin UI for editing scenarios.
- Mobile native app.
- Professional phoneme-level pronunciation scoring.
- Course marketplace, leaderboard, or social features.

## Target Users

The initial user is an English learner who wants realistic spoken practice in common situations such as interviews, restaurants, business meetings, travel, and daily conversation. The app should prioritize low friction, natural conversation, and actionable feedback over complex learning management features.

## Product Requirements

### Scenario Selection

Users can choose from multiple built-in scenarios. The MVP should include at least five:

- Job interview
- Restaurant ordering
- Business meeting
- Travel or airport
- Small talk

Each scenario defines the AI role, user role, opening message, practice goals, correction policy, and summary rubric.

### Real-Time Voice Practice

Users start a session from a selected scenario. The browser captures microphone audio and sends it to a realtime voice model. The AI responds with spoken audio and keeps the conversation aligned with the selected role-play.

The UI must show clear session states:

- Idle
- Connecting
- Connected
- Listening
- AI speaking
- Ending
- Error

### Natural Conversation

The AI should behave as a realistic conversation partner. It should ask follow-up questions, keep the scenario moving, and avoid over-correcting every user sentence. Corrections should be brief during the session and more detailed after the session ends.

### Corrections

During the session, the app should surface lightweight feedback when available:

- Grammar issue
- More natural expression
- Pronunciation or clarity note
- Suggested replacement sentence

The correction policy is scenario-specific. For example, an interview scenario can focus on concise professional answers, while restaurant ordering can focus on simple, natural requests.

### Post-Session Summary

When a user ends practice, the app generates a structured summary with:

- Overall score
- Fluency score
- Pronunciation clarity score
- Grammar accuracy score
- Expression naturalness score
- Strengths
- Main issues
- Corrected sentences
- Recommended expressions
- Next practice suggestions

The summary should be stored in local history.

### Local History

The app saves recent session summaries in `localStorage`. The MVP should keep a bounded list, for example the latest 20 summaries. History must work without login and without a backend database.

## Architecture

### Recommended Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod for schema validation
- OpenAI Realtime API over WebRTC for low-latency voice interaction
- Next.js Route Handlers for session creation
- Browser `localStorage` for local history

### High-Level Flow

1. The user opens the app and selects a scenario.
2. The app validates and loads scenario metadata.
3. The user starts a practice session.
4. The browser asks for microphone permission.
5. The frontend requests a realtime session from a Next.js API route.
6. The API route uses the server-side OpenAI API key to create the realtime session.
7. The browser establishes a WebRTC connection.
8. User audio streams to the realtime model.
9. AI audio streams back to the browser.
10. Realtime events update transcript, state, and correction panels.
11. The user ends the session.
12. The app asks the model for a structured summary.
13. The summary is rendered and saved to `localStorage`.

## Scenario Configuration

Scenario files should be treated as product configuration, not hard-coded UI logic. JSON is the first implementation format because it avoids extra parsing dependencies and keeps validation simple. YAML can be added later without changing the scenario schema.

Example:

```json
{
  "id": "job-interview",
  "title": "Job Interview",
  "description": "Practice answering common interview questions in English.",
  "difficulty": "medium",
  "aiRole": "Interviewer",
  "userRole": "Candidate",
  "openingMessage": "Tell me about yourself.",
  "goals": [
    "Answer questions clearly",
    "Use professional expressions",
    "Give concrete examples"
  ],
  "realtimeInstructions": "You are an English interview coach playing the role of an interviewer. Keep the conversation realistic. Ask one question at a time. Give brief corrections only when they help the user continue.",
  "correctionPolicy": {
    "interruptLevel": "low",
    "focus": ["grammar", "pronunciation_clarity", "professional_expression"]
  },
  "summaryRubric": [
    {
      "key": "fluency",
      "label": "Fluency",
      "description": "Smoothness, pacing, and ability to continue speaking."
    },
    {
      "key": "grammar",
      "label": "Grammar",
      "description": "Accuracy of sentence structure and tense usage."
    },
    {
      "key": "pronunciation",
      "label": "Pronunciation",
      "description": "Clarity and intelligibility of spoken English."
    },
    {
      "key": "expression",
      "label": "Expression",
      "description": "Naturalness and appropriateness of word choice."
    }
  ]
}
```

### Type Shape

```ts
type PracticeScenario = {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  aiRole: string;
  userRole: string;
  openingMessage: string;
  goals: string[];
  realtimeInstructions: string;
  correctionPolicy: {
    interruptLevel: "low" | "medium";
    focus: Array<"grammar" | "pronunciation_clarity" | "expression" | "professional_expression" | "vocabulary">;
  };
  summaryRubric: Array<{
    key: string;
    label: string;
    description: string;
  }>;
};
```

## Frontend Structure

### Screens

- Home or practice entry screen: scenario selection and recent history.
- Practice screen: selected scenario, voice controls, transcript, correction panel.
- Summary screen or panel: structured feedback after the session ends.

### Main Components

- `ScenarioPicker`: lists available scenarios and difficulty.
- `PracticeRoom`: owns the active scenario and session lifecycle.
- `VoiceControls`: start, pause or stop, mute, and connection state.
- `TranscriptView`: displays conversation transcript.
- `CorrectionPanel`: displays lightweight live feedback.
- `SessionSummary`: displays post-session scoring and recommendations.
- `PracticeHistory`: displays local summaries.

## Backend Structure

### API Routes

- `POST /api/realtime/session`
  - Input: scenario id.
  - Loads and validates scenario configuration.
  - Creates a realtime session using server-side credentials.
  - Applies scenario-specific instructions.
  - Returns connection material needed by the browser.

- `POST /api/session/summary`
  - Input: scenario id and session transcript.
  - Returns structured summary JSON.
  - May use the same scenario rubric to guide scoring.

The exact realtime session mechanism should follow the latest OpenAI Realtime API guidance during implementation. Browser voice sessions should prefer WebRTC for lower latency.

## Data Models

### Transcript Item

```ts
type TranscriptItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};
```

### Correction Item

```ts
type CorrectionItem = {
  id: string;
  type: "grammar" | "pronunciation" | "expression" | "vocabulary";
  original?: string;
  suggestion: string;
  explanation: string;
  createdAt: string;
};
```

### Practice Summary

```ts
type PracticeSummary = {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  createdAt: string;
  durationSeconds: number;
  scores: {
    overall: number;
    fluency: number;
    pronunciation: number;
    grammar: number;
    expression: number;
  };
  strengths: string[];
  issues: string[];
  correctedSentences: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
  recommendedExpressions: string[];
  nextPracticeSuggestions: string[];
};
```

## Error Handling

- Microphone permission denied: show a clear retry path.
- Realtime connection failure: show error state and allow reconnect.
- Missing API key: show server-side configuration error in development.
- Invalid scenario config: fail fast during development with validation details.
- Summary generation failure: preserve transcript and show a retry action.
- Local history write failure: continue the session and show a non-blocking warning.

## Testing Strategy

### Unit Tests

- Scenario schema validation.
- Local history read/write behavior.
- Summary JSON parsing and fallback handling.

### Integration Tests

- Scenario selection loads correct metadata.
- Practice session state transitions.
- Summary saves to local history.

### Manual Verification

- Start a session and hear AI audio output.
- Speak into the microphone and confirm the AI responds.
- End a session and receive a structured summary.
- Refresh the page and confirm local history remains.
- Try at least two scenarios and confirm different role behavior.

## MVP Acceptance Criteria

- The app can be started locally as a Next.js app.
- Users can select at least five scenarios.
- Scenario configs are validated through a shared schema.
- Users can start a voice session from a selected scenario.
- The AI responds with voice.
- The AI follows the selected scenario role and goals.
- Users can end a session and see a structured summary.
- Summary includes quantitative scores and qualitative feedback.
- Recent summaries are saved locally.
- No OpenAI API key is exposed to browser code.

## Extension Points

- Replace local JSON scenarios with database-backed scenarios.
- Add YAML scenario files if non-developers need friendlier editing.
- Add admin UI for scenario editing.
- Add login and server-side history.
- Add user-defined custom scenarios.
- Add richer pronunciation analysis.
- Add lesson plans or multi-step practice flows.
- Add analytics for long-term progress.
- Add multilingual UI while keeping English practice content.

## Implementation Priority

### Day 1

- Scaffold Next.js project.
- Add TypeScript, Tailwind, and base layout.
- Add scenario config files and Zod validation.
- Build scenario picker and practice room shell.
- Implement realtime session API route.
- Connect browser microphone and AI voice response.

### Day 2

- Add transcript and correction panels.
- Add summary generation route.
- Add summary UI.
- Add local history.
- Add error states and retry actions.
- Perform end-to-end manual verification.
