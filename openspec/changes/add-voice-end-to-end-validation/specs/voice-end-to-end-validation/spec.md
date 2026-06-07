## ADDED Requirements

### Requirement: Voice E2E Validation Checklist
The system SHALL define a repeatable validation checklist for the realtime voice practice flow.

#### Scenario: Checklist covers the full voice path
- **WHEN** a developer validates the voice MVP
- **THEN** the checklist SHALL include session creation, PCM capture, audio send, Qwen transcript, SSE UI update, and session end

### Requirement: Safe Voice Diagnostics
The system SHALL expose safe diagnostics for voice sessions.

#### Scenario: Diagnostics show non-secret status
- **WHEN** a voice session is active
- **THEN** diagnostics SHALL show provider, model, audio format, SSE status, last event type, and fallback reason

#### Scenario: Diagnostics exclude secrets and raw audio
- **WHEN** diagnostics are rendered or serialized
- **THEN** they SHALL NOT include API key, Authorization header, provider secret, raw PCM bytes, or base64 audio

### Requirement: Manual Demo Validation
The system SHALL support manual validation with a real microphone.

#### Scenario: User transcript appears
- **WHEN** the developer speaks one sentence in voice mode
- **THEN** the UI SHALL show a user transcript from Qwen events or a safe fallback reason

#### Scenario: Assistant transcript appears
- **WHEN** Qwen responds to the user utterance
- **THEN** the UI SHALL show the assistant transcript through SSE
