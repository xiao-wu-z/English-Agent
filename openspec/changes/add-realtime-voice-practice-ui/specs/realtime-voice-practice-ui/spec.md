## ADDED Requirements

### Requirement: Voice Practice UI State
The system SHALL define a realtime voice practice UI state machine.

#### Scenario: Supported voice UI states are finite
- **WHEN** voice UI state is validated
- **THEN** it SHALL be one of `idle`, `requesting_microphone`, `ready`, `connecting`, `listening`, `thinking`, `speaking`, `ending`, `completed`, `failed`, or `abandoned`

#### Scenario: Microphone request state is explicit
- **WHEN** the user starts voice practice
- **THEN** UI SHALL enter `requesting_microphone` before accessing microphone input

#### Scenario: User cancellation is explicit
- **WHEN** the user cancels voice practice
- **THEN** UI SHALL transition to `abandoned`

### Requirement: Browser Audio Input
The system SHALL define MediaRecorder-based audio input for MVP voice practice.

#### Scenario: MediaRecorder is used for MVP
- **WHEN** voice practice records user audio in this change
- **THEN** it SHALL use browser MediaRecorder boundary rather than AudioWorklet

#### Scenario: Audio chunks are sent but not persisted
- **WHEN** MediaRecorder produces audio chunks
- **THEN** chunks SHALL be sent to provider/session bridge
- **AND** they SHALL NOT be saved to local history

#### Scenario: Unsupported recorder fails safely
- **WHEN** MediaRecorder is unavailable
- **THEN** UI SHALL show a safe failure state or fallback suggestion

### Requirement: Provider Event Mapping
The system SHALL map normalized realtime provider events to voice UI state and display.

#### Scenario: User partial transcript updates temporary caption
- **WHEN** `transcript.user.partial` event is received
- **THEN** UI SHALL update user temporary transcript text

#### Scenario: User final transcript creates final turn
- **WHEN** `transcript.user.final` event is received
- **THEN** UI SHALL commit the user transcript as a final user turn

#### Scenario: Assistant partial transcript updates temporary caption
- **WHEN** `transcript.assistant.partial` event is received
- **THEN** UI SHALL update assistant temporary transcript text

#### Scenario: Assistant final transcript creates assistant message
- **WHEN** `transcript.assistant.final` event is received
- **THEN** UI SHALL commit the assistant transcript as a final assistant message

#### Scenario: Audio delta enters playback queue
- **WHEN** `audio.delta` event is received
- **THEN** UI SHALL enqueue playable audio data or metadata for playback

#### Scenario: Provider error updates failed state
- **WHEN** provider `error` event is received
- **THEN** UI SHALL enter failed state with a safe user-facing message

### Requirement: Voice Practice Session Bridge
The system SHALL route voice practice traffic through server-side session bridge.

#### Scenario: Frontend creates session through local API
- **WHEN** voice practice starts
- **THEN** frontend SHALL create realtime practice session through the app's own Next API route

#### Scenario: Frontend sends audio through local API
- **WHEN** audio chunks are produced
- **THEN** frontend SHALL send them through the app's own session route or bridge, not directly to Qwen

#### Scenario: Frontend consumes normalized events
- **WHEN** provider events are delivered to UI
- **THEN** they SHALL use normalized realtime provider event schema

### Requirement: Realtime Correction Display
The system SHALL display realtime voice corrections only after final user transcript.

#### Scenario: No correction while user is speaking
- **WHEN** voice UI is listening to user speech
- **THEN** it SHALL NOT interrupt with a correction overlay

#### Scenario: Final transcript can trigger one Chinese correction
- **WHEN** `transcript.user.final` is received and a high-confidence correction exists
- **THEN** UI MAY display at most one Chinese realtime correction

#### Scenario: Low-confidence correction is deferred
- **WHEN** correction confidence is low or medium
- **THEN** UI SHALL NOT display it in realtime and SHALL defer it to summary

### Requirement: Audio Output Boundary
The system SHALL define AI audio playback queue behavior.

#### Scenario: Audio delta can be played
- **WHEN** audio delta events are received
- **THEN** UI SHALL maintain a playback queue for them

#### Scenario: Playback failure falls back to transcript
- **WHEN** audio playback fails
- **THEN** UI SHALL continue showing assistant transcript text

#### Scenario: Complex visualization is excluded
- **WHEN** voice practice UI is implemented
- **THEN** it SHALL NOT require waveform visualization

### Requirement: Voice Session Ending
The system SHALL end voice practice through existing session summary flow.

#### Scenario: End voice session triggers summary
- **WHEN** user ends a voice practice session
- **THEN** the system SHALL trigger final assessment, correction aggregation, summary, completion, and local history save

#### Scenario: Summary failure prevents completion
- **WHEN** summary generation fails
- **THEN** voice session SHALL NOT be marked completed

### Requirement: Voice Secret Safety
The system SHALL keep provider credentials and raw audio out of client-visible persisted data.

#### Scenario: Client does not receive provider secrets
- **WHEN** voice UI runs
- **THEN** it SHALL NOT receive API keys, Authorization headers, provider secrets, or raw provider config

#### Scenario: Client does not call Qwen directly
- **WHEN** voice UI sends text or audio
- **THEN** it SHALL NOT call Qwen provider endpoint directly

#### Scenario: Raw audio is not stored
- **WHEN** voice session history is saved
- **THEN** raw audio blobs, bytes, and recording files SHALL NOT be persisted

### Requirement: Mock-First Voice UI
The system SHALL allow voice UI flow to run with mock realtime provider by default.

#### Scenario: Mock provider supports voice UI testing
- **WHEN** voice UI is run without external credentials
- **THEN** it SHALL be able to exercise session created, transcript, audio delta placeholder, and session closed events using mock realtime provider

#### Scenario: Text demo remains available
- **WHEN** voice UI is added
- **THEN** existing text practice demo SHALL remain usable
