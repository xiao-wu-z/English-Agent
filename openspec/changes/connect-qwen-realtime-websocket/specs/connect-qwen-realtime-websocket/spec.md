## ADDED Requirements

### Requirement: Qwen Realtime WebSocket Connection
The system SHALL connect to Qwen realtime WebSocket from server-only code.

#### Scenario: Server connects to Qwen realtime endpoint
- **WHEN** a realtime voice session is created with Qwen provider enabled
- **THEN** server-side code SHALL connect to Qwen realtime WebSocket using model `qwen3.5-omni-plus-realtime`

#### Scenario: API key remains server-only
- **WHEN** Qwen WebSocket connection is created
- **THEN** API key SHALL be read only from server-side environment and SHALL NOT be sent to browser

#### Scenario: Missing key fails safely
- **WHEN** Qwen provider is enabled without `DASHSCOPE_API_KEY` or `QWEN_API_KEY`
- **THEN** session creation SHALL fail with safe `missing_api_key` error

### Requirement: SSE Event Stream
The system SHALL stream normalized realtime events to browser using SSE.

#### Scenario: Events route returns event stream
- **WHEN** browser calls `GET /api/realtime-practice-sessions/:id/events`
- **THEN** route SHALL return `text/event-stream`

#### Scenario: SSE emits normalized events
- **WHEN** Qwen emits realtime provider events
- **THEN** server bridge SHALL normalize them to `RealtimeProviderEvent` and send them as SSE data

#### Scenario: SSE disconnect is handled
- **WHEN** browser disconnects from SSE
- **THEN** server bridge SHALL remove that subscriber without exposing secrets

### Requirement: Audio Chunk Forwarding
The system SHALL forward browser audio chunks to Qwen realtime session.

#### Scenario: Audio route accepts chunks
- **WHEN** browser posts audio chunk to `/api/realtime-practice-sessions/:id/audio`
- **THEN** server bridge SHALL validate and forward it to the active Qwen WebSocket session

#### Scenario: Empty chunk is rejected
- **WHEN** audio chunk is empty
- **THEN** route SHALL fail with `audio_chunk_invalid`

#### Scenario: Raw audio is not persisted
- **WHEN** audio chunk is received
- **THEN** server SHALL NOT save raw audio to local history or badcase log

### Requirement: Qwen Event Normalization
The system SHALL map Qwen provider-specific events to normalized realtime events.

#### Scenario: User transcript maps to normalized event
- **WHEN** Qwen emits user transcript partial or final event
- **THEN** server bridge SHALL emit `transcript.user.partial` or `transcript.user.final`

#### Scenario: Assistant transcript maps to normalized event
- **WHEN** Qwen emits assistant transcript partial or final event
- **THEN** server bridge SHALL emit `transcript.assistant.partial` or `transcript.assistant.final`

#### Scenario: Audio response maps to audio delta
- **WHEN** Qwen emits assistant audio payload
- **THEN** server bridge SHALL emit `audio.delta`

#### Scenario: Unknown events are safe
- **WHEN** Qwen emits unsupported event type
- **THEN** server bridge SHALL ignore it or emit safe `error` without exposing raw secrets

### Requirement: Voice UI Uses Real Browser Audio
The system SHALL update voice UI to use browser microphone and SSE events.

#### Scenario: Voice UI requests microphone
- **WHEN** user starts voice mode
- **THEN** browser SHALL request microphone access before sending audio

#### Scenario: Voice UI sends MediaRecorder chunks
- **WHEN** MediaRecorder produces audio chunks
- **THEN** UI SHALL POST chunks to the app audio route

#### Scenario: Voice UI consumes SSE events
- **WHEN** SSE emits transcript or audio events
- **THEN** UI SHALL update transcript, playback queue, and voice state from normalized events

### Requirement: Transcript-First Fallback
The system SHALL prioritize transcript correctness over audio playback.

#### Scenario: Transcript displays even if audio playback fails
- **WHEN** audio playback cannot decode or play an audio delta
- **THEN** UI SHALL continue showing user and assistant transcript text

#### Scenario: Audio playback does not block turn flow
- **WHEN** assistant transcript is available before playable audio
- **THEN** UI SHALL display assistant transcript without waiting for audio playback

### Requirement: Session Close
The system SHALL close Qwen realtime sessions explicitly.

#### Scenario: End route closes WebSocket
- **WHEN** browser calls `POST /api/realtime-practice-sessions/:id/end`
- **THEN** server bridge SHALL close the Qwen WebSocket session

#### Scenario: Closed session emits normalized event
- **WHEN** realtime session closes
- **THEN** server bridge SHALL emit `session.closed`

### Requirement: Secret Safety
The system SHALL keep Qwen secrets out of client-visible data.

#### Scenario: SSE event excludes secrets
- **WHEN** SSE sends event data
- **THEN** event payload SHALL NOT include API key, Authorization header, provider secret, or raw provider config

#### Scenario: Error excludes secrets
- **WHEN** Qwen connection or event parsing fails
- **THEN** returned error SHALL use safe code/message and SHALL NOT include secret values

#### Scenario: Source files do not contain real key
- **WHEN** this change is implemented
- **THEN** source files, OpenSpec files, tests, and commit messages SHALL NOT contain real API key

### Requirement: Mock Fallback
The system SHALL preserve mock realtime provider fallback.

#### Scenario: Mock remains default
- **WHEN** provider config is unset or mock
- **THEN** voice UI and realtime routes SHALL continue to run with mock provider

#### Scenario: Qwen requires explicit provider
- **WHEN** `MODEL_PROVIDER=qwen` is not configured
- **THEN** system SHALL NOT attempt Qwen WebSocket connection
