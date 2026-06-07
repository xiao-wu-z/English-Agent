## ADDED Requirements

### Requirement: Next Text Practice Demo
The system SHALL provide a Next.js text-first practice demo flow for MVP validation.

#### Scenario: Demo starts from scenario selection
- **WHEN** the learner opens the demo page
- **THEN** they SHALL be able to choose a built-in practice scenario

#### Scenario: Demo creates practice session
- **WHEN** the learner starts a selected scenario
- **THEN** the system SHALL create a practice session with that scenario id and scenario version

#### Scenario: Demo uses text input and output
- **WHEN** the learner practices in this change
- **THEN** input and output SHALL be text
- **AND** the flow SHALL NOT require microphone, ASR, TTS, WebRTC, WebSocket, or realtime audio

### Requirement: Practice Session API Routes
The system SHALL define Next Route Handlers for text practice sessions.

#### Scenario: Create session route exists
- **WHEN** `POST /api/practice-sessions` is called with a valid scenario id
- **THEN** it SHALL create and return a practice session and scenario data

#### Scenario: Submit turn route exists
- **WHEN** `POST /api/practice-sessions/:id/turns` is called with active session id and non-empty user text
- **THEN** it SHALL append a practice turn and return AI reply plus optional correction decision

#### Scenario: End session route exists
- **WHEN** `POST /api/practice-sessions/:id/end` is called for an active session
- **THEN** it SHALL end the session, produce a summary, persist local history, and return summary data

#### Scenario: Get session route exists
- **WHEN** `GET /api/practice-sessions/:id` is called with an existing session id
- **THEN** it SHALL return the current session state

### Requirement: Mock Provider Default
The system SHALL allow text practice demo to run without external model credentials by default.

#### Scenario: Mock provider is default
- **WHEN** no provider environment is configured
- **THEN** text practice demo SHALL use mock provider behavior

#### Scenario: Qwen key is not required for text demo
- **WHEN** the text practice demo is run locally
- **THEN** it SHALL NOT require `DASHSCOPE_API_KEY`, `QWEN_API_KEY`, or Qwen realtime credentials

### Requirement: Turn Orchestration
The system SHALL define per-turn orchestration for text practice.

#### Scenario: Active session is required
- **WHEN** a text turn is submitted
- **THEN** the session SHALL be active before orchestration proceeds

#### Scenario: Empty user text is rejected
- **WHEN** a text turn is submitted with empty or whitespace-only content
- **THEN** the route SHALL return a validation error

#### Scenario: Practice skill produces AI reply
- **WHEN** a valid user text turn is submitted
- **THEN** the system SHALL use practice skill flow to produce an AI text reply

#### Scenario: Correction decision is gated
- **WHEN** a correction candidate is produced for a turn
- **THEN** bounded ReAct quality decision SHALL determine whether to show, suppress, or defer it

### Requirement: End Session Orchestration
The system SHALL define post-session assessment and summary flow.

#### Scenario: Ending active session transitions state
- **WHEN** an active session is ended
- **THEN** it SHALL transition through ending before completed

#### Scenario: Summary is produced before completion
- **WHEN** a session completes normally
- **THEN** final summary SHALL be produced before the session is marked completed

#### Scenario: Failed summary does not complete session
- **WHEN** summary generation fails
- **THEN** the session SHALL NOT be marked completed

#### Scenario: Completed session saves local history
- **WHEN** a session completes normally
- **THEN** the system SHALL attempt to save it to local practice history

### Requirement: Minimal Next Page
The system SHALL define a minimal Next.js page for the text practice demo.

#### Scenario: Page shows core practice controls
- **WHEN** the demo page is rendered
- **THEN** it SHALL include scenario selection, session status, conversation messages, text input, end practice action, after-turn correction area, and summary area

#### Scenario: Page does not implement voice controls
- **WHEN** the text demo page is rendered
- **THEN** it SHALL NOT include microphone recording, audio playback controls, ASR controls, TTS controls, WebRTC controls, or WebSocket controls

#### Scenario: History entry is limited
- **WHEN** local history is referenced from the text demo
- **THEN** the page MAY provide a simple history entry or placeholder
- **AND** it SHALL NOT implement a full history management page in this change

### Requirement: Text Demo Error Handling
The system SHALL expose clear errors for text practice demo routes.

#### Scenario: Unknown scenario fails clearly
- **WHEN** session creation receives an unknown scenario id
- **THEN** the route SHALL return a clear client error

#### Scenario: Missing session fails clearly
- **WHEN** turn submission, session end, or session get receives a missing session id
- **THEN** the route SHALL return a not found error

#### Scenario: Inactive session rejects turn
- **WHEN** a turn is submitted to a session that is not active
- **THEN** the route SHALL return a conflict error

#### Scenario: Unsafe provider output is not appended
- **WHEN** provider output fails schema validation or ReAct quality gate
- **THEN** unsafe user-visible output SHALL NOT be appended as a normal assistant reply

#### Scenario: History save failure is explicit
- **WHEN** local history save fails after summary succeeds
- **THEN** the route SHALL return summary data with `savedToHistory: false` and safe error code

### Requirement: Secret Safety For Demo Flow
The system SHALL keep provider credentials out of text demo code and artifacts.

#### Scenario: No real API key is required
- **WHEN** text practice demo flow is implemented
- **THEN** it SHALL NOT require a real API key for default operation

#### Scenario: No credentials are persisted
- **WHEN** session, turn, summary, prompt, or local history data is created
- **THEN** it SHALL NOT include API keys, provider secrets, Authorization headers, or hidden reasoning

#### Scenario: Qwen realtime remains separate
- **WHEN** Qwen realtime model `qwen3.5-omni-plus-realtime` is configured later
- **THEN** that configuration SHALL belong to a separate realtime voice provider change, not this text demo flow

### Requirement: No Voice Or Realtime In This Change
The system SHALL avoid voice and realtime transport implementation in the text demo change.

#### Scenario: No audio transport is required
- **WHEN** text practice demo flow is complete
- **THEN** it SHALL NOT create WebRTC sessions, WebSocket connections, audio streams, ASR sessions, or TTS playback

#### Scenario: No realtime provider is implemented
- **WHEN** text practice demo flow is complete
- **THEN** it SHALL NOT implement Qwen Omni or any realtime model provider
