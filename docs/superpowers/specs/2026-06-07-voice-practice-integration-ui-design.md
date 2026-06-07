# Voice Practice Integration and UI Design

## Goal

Complete the existing voice-practice product loop by connecting realtime voice sessions to the existing voice Skill runtime, exposing scenario-aware corrections and reports, and restructuring the page into a focused single-page practice room.

This change reuses existing scenario, correction, assessment, summary, history, realtime provider, SSE, PCM capture, and PCM playback capabilities. It does not replace those implementations.

## Current Gap

The codebase currently has two independent session flows:

- `realtime-voice-flow` owns the provider WebSocket, audio upload, normalized events, SSE subscribers, and realtime session lifecycle.
- `voice-skill-flow` owns final-transcript persistence, lightweight correction, assessment, summary generation, and history behavior.

The UI creates only a realtime session. Final user transcripts never enter `handleVoiceTranscript()`, and the realtime end route never calls `endVoiceSkillSession()`. The hard-coded scenario list also duplicates validated scenario configuration.

## Considered Approaches

### 1. Server-composed voice session

Create realtime and Skill sessions together and keep their mapping on the server.

Advantages:

- One public session ID for the browser.
- Transcript, correction, summary, and lifecycle orchestration remain server-owned.
- The browser does not need to coordinate two session IDs or recover partial failures.
- Existing realtime routes can evolve without changing the UI contract.

This is the selected approach.

### 2. Browser-managed dual sessions

The browser creates and stores realtime and Skill session IDs separately, forwarding final transcripts to a second API.

This requires less server refactoring but makes the page responsible for ordering, retries, duplicate transcript handling, and split lifecycle recovery. It is rejected because those are business orchestration concerns.

### 3. Replace realtime sessions with Skill sessions

Expand `voice-skill-flow` until it directly owns provider connections and SSE.

This produces one conceptual session but couples model transport to pedagogical workflow and duplicates stable realtime code. It is rejected for this iteration.

## Architecture

Introduce a composed voice-practice session inside `realtime-voice-flow`:

```text
Public voice session
├── realtime provider session
├── Skill practice session
├── normalized provider events
├── correction events
├── transcript processing state
└── final summary
```

Session creation performs these steps:

1. Validate the selected scenario from the scenario catalog.
2. Create the Skill session with `createVoiceSkillSession()`.
3. Create the realtime provider session.
4. Store both internal IDs under the public realtime session ID.
5. Return scenario metadata and one public session ID to the browser.

If either creation step fails, the public session is not exposed. Any successfully created provider resource is closed where possible.

## Transcript and Correction Flow

Only `transcript.user.final` enters the Skill runtime. Partial transcripts remain display-only.

```text
Qwen transcript.user.final
        |
        v
deduplicate by provider event ID
        |
        v
handleVoiceTranscript(skillSessionId, transcript)
        |
        +--> persisted practice turn
        +--> optional high-confidence correction
        |
        v
SSE correction.ready event
```

The realtime event remains available to the UI immediately. Skill processing runs asynchronously but in arrival order per session. A transcript-processing chain prevents later final transcripts from overtaking earlier ones.

`correction.ready` contains the existing `CorrectionItem` contract and no raw audio. A missing or suppressed correction emits no correction event. Skill failures emit a safe workflow error without closing an otherwise healthy realtime conversation.

## End and Report Flow

The end route becomes the single completion boundary:

1. Set composed session status to `ending`.
2. Stop microphone capture on the browser before calling the route.
3. Wait for queued final-transcript Skill processing to finish.
4. Close the realtime provider session.
5. Call `endVoiceSkillSession()` with the internal Skill session ID.
6. Store and return the structured `PracticeSummary`.
7. Mark the composed session `completed`.

The response returns:

- session status;
- structured summary;
- history persistence result;
- selected scenario metadata.

If report generation fails, the realtime provider still closes. The UI retains the transcript and offers a report retry action. Retrying report generation must not create duplicate practice turns.

## Scenario Selection

The UI consumes the validated scenario catalog instead of maintaining a second hard-coded list.

Each scenario card displays:

- Chinese title and description;
- difficulty;
- recommended session duration;
- learner role and AI role;
- two primary practice goals.

The selected scenario is locked while a session is active. Changing the scenario requires ending or cancelling the current session.

The provider session instructions must be derived from the selected scenario context rather than a generic hard-coded coach prompt. They include role, setting, learner purpose, goals, tone, and concise conversation constraints.

## Single-Page Practice Room

The page uses four product states:

```text
scenario_select -> practicing -> ending -> report
                        |
                        +-> recoverable_error
```

### Scenario selection

A welcoming header and compact scenario cards are the primary entry. Text and voice modes remain available, but voice is visually primary.

### Practice room

The active session uses a three-column desktop layout:

- Left: selected scenario, goals, duration, and session controls.
- Center: conversation transcript, live partial transcript, and speaking/listening status.
- Right: latest lightweight correction, connection health, and compact audio diagnostics.

On smaller screens these sections stack in the same priority order: conversation, controls, correction, diagnostics.

The primary control is state-aware:

- `开始练习`
- `开始说话`
- `停止并发送`
- `结束并生成报告`

Diagnostic details are visually secondary and collapsible. Provider names, event counts, and MIME types do not dominate the learning interface.

### Lightweight correction

At most one correction is shown after each final user turn. The card includes:

- original expression;
- corrected expression;
- short Chinese explanation;
- correction category.

It does not interrupt recording or cover the transcript. New corrections replace the prominent card while all accepted corrections remain available in the final report.

### Report

The report replaces the practice workspace after successful completion. It contains:

- overall score;
- six dimension scores;
- strengths;
- priority issues;
- corrected sentences;
- recommended expressions;
- next-practice suggestions;
- disclaimer;
- selected scenario identity.

Actions include starting the same scenario again and returning to scenario selection.

## Component Boundaries

Refactor the current page into focused components without introducing a new state framework:

- `ScenarioPicker`
- `PracticeHeader`
- `VoicePracticeRoom`
- `ConversationTranscript`
- `VoiceControls`
- `CorrectionPanel`
- `VoiceDiagnostics`
- `PracticeReport`

The page retains session orchestration state. Pure display and interaction sections receive typed props. Existing text-practice behavior remains available and shares scenario metadata and report rendering where practical.

## API and Event Contracts

Existing routes remain:

- `POST /api/realtime-practice-sessions`
- `POST /api/realtime-practice-sessions/:id/audio`
- `GET /api/realtime-practice-sessions/:id/events`
- `POST /api/realtime-practice-sessions/:id/end`

The normalized SSE union is extended with application events:

- `correction.ready`
- `workflow.error`

Provider events and application events use distinct schemas but share session ID, event ID, and creation timestamp fields.

The create route returns public scenario metadata. The end route returns the existing structured summary contract.

## Error Handling

- Correction failure: continue conversation, show a non-blocking feedback notice.
- Summary failure: preserve transcript, close realtime resources, enable retry.
- Duplicate final transcript: ignore it by provider event ID.
- End requested while transcript processing is active: wait for the processing chain.
- Unexpected provider close: preserve processed turns and allow report generation from partial session data.
- History persistence failure: show the report and indicate that local history was not saved.
- Scenario mismatch or unknown scenario: fail before provider session creation.

No raw audio, base64 audio, API key, provider authorization data, or hidden reasoning may enter correction, summary, history, diagnostics, or user-visible errors.

## Testing

### Unit tests

- Public session creation creates and maps both internal sessions.
- Final transcripts enter the Skill runtime exactly once and in order.
- Partial transcripts never create practice turns.
- High-confidence corrections produce `correction.ready`.
- Suppressed corrections produce no correction event.
- End waits for transcript processing before generating a summary.
- Summary retry does not duplicate turns.
- Scenario instructions are derived from the selected catalog entry.

### Route tests

- Create response includes scenario metadata and one public ID.
- SSE emits provider events and correction events.
- End response contains a schema-valid report.
- Error responses do not expose secrets or audio.

### UI tests

- Scenario selection changes the displayed goals and session request.
- Active sessions lock scenario selection.
- Final correction appears in the feedback panel.
- Ending shows progress and then report content.
- Report failure preserves the transcript and exposes retry.

### Manual verification

- Complete at least one daily-small-talk and one job-interview voice session.
- Confirm the realtime role behavior changes with the scenario.
- Trigger a known correction such as `I want talk about...`.
- End the session and verify scores, corrections, recommendations, and next steps.
- Confirm microphone audio is not persisted.

## Scope

This iteration connects existing capabilities and improves the practice experience. It does not add authentication, server databases, custom scenarios, professional pronunciation scoring, waveform visualization, or cross-device history.
