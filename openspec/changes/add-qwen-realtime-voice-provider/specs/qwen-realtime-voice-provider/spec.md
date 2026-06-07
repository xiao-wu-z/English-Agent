## ADDED Requirements

### Requirement: Realtime Model Provider Interface
The system SHALL define a provider-neutral realtime model provider interface.

#### Scenario: Provider can create realtime session
- **WHEN** a realtime provider creates a session
- **THEN** it SHALL return a session id, provider name, model name, status, and createdAt

#### Scenario: Provider can send text input
- **WHEN** text is sent to an active realtime session
- **THEN** the provider SHALL accept the text without requiring microphone or audio input

#### Scenario: Provider can send audio chunk input
- **WHEN** audio bytes are sent to an active realtime session
- **THEN** the provider SHALL accept a binary chunk through a provider-neutral method

#### Scenario: Provider can end realtime session
- **WHEN** a realtime session is ended
- **THEN** the provider SHALL close the session and emit or return a closed state

### Requirement: Qwen Realtime Provider Configuration
The system SHALL define server-only configuration for Qwen realtime voice provider.

#### Scenario: Qwen realtime model has default
- **WHEN** Qwen realtime provider is configured without explicit model
- **THEN** it SHALL use `qwen3.5-omni-plus-realtime`

#### Scenario: Qwen provider reads server-only API key
- **WHEN** Qwen realtime provider initializes
- **THEN** it SHALL read API key from `DASHSCOPE_API_KEY` or `QWEN_API_KEY` in server-only code

#### Scenario: Missing key fails clearly
- **WHEN** `MODEL_PROVIDER=qwen` is configured and no Qwen-compatible API key exists
- **THEN** provider resolution SHALL fail with `missing_api_key`

### Requirement: Mock Realtime Provider
The system SHALL provide a mock realtime provider for local development and tests.

#### Scenario: Mock is default
- **WHEN** no realtime provider is configured
- **THEN** realtime provider registry SHALL resolve mock provider

#### Scenario: Mock emits deterministic transcript events
- **WHEN** text is sent to mock realtime provider
- **THEN** it SHALL be able to emit user final transcript and assistant final transcript events

#### Scenario: Mock does not require API key
- **WHEN** mock realtime provider is used
- **THEN** it SHALL NOT require `DASHSCOPE_API_KEY`, `QWEN_API_KEY`, or any external credentials

### Requirement: Realtime Provider Events
The system SHALL define normalized realtime provider event schema.

#### Scenario: Supported event types are finite
- **WHEN** realtime provider event is validated
- **THEN** type SHALL be one of `session.created`, `transcript.user.partial`, `transcript.user.final`, `transcript.assistant.partial`, `transcript.assistant.final`, `audio.delta`, `interruption`, `error`, or `session.closed`

#### Scenario: Event includes attribution
- **WHEN** a realtime provider event is created
- **THEN** it SHALL include event id, session id, type, provider name, model name, and createdAt

#### Scenario: Transcript event carries text
- **WHEN** transcript event is emitted
- **THEN** it SHALL be able to include text payload

#### Scenario: Audio delta carries binary-safe payload
- **WHEN** audio delta event is emitted
- **THEN** it SHALL be able to include binary-safe audio payload metadata without exposing secrets

### Requirement: Realtime Provider Errors
The system SHALL define safe realtime provider errors.

#### Scenario: Error codes are finite
- **WHEN** realtime provider error is created
- **THEN** code SHALL be one of `missing_api_key`, `session_create_failed`, `event_parse_failed`, `audio_chunk_invalid`, `connection_closed`, `timeout`, or `unsupported_provider`

#### Scenario: Error excludes secrets
- **WHEN** realtime provider error is returned or emitted
- **THEN** it SHALL NOT include API key, Authorization header, provider secret, secret environment value, or raw provider config

### Requirement: Secret Safety
The system SHALL keep Qwen realtime credentials out of client code and persisted data.

#### Scenario: Secrets are server-only
- **WHEN** Qwen realtime provider reads credentials
- **THEN** the reading code SHALL live in server-only modules and SHALL NOT be imported by client components

#### Scenario: Secrets are not persisted
- **WHEN** realtime session, event, prompt, local history, or badcase data is stored
- **THEN** it SHALL NOT include API keys, Authorization headers, provider secrets, or secret environment values

#### Scenario: Real API key is not committed
- **WHEN** this change is implemented
- **THEN** source files, OpenSpec files, tests, and commit messages SHALL NOT contain a real API key

### Requirement: No Voice UI In This Change
The system SHALL avoid implementing voice user interface in the realtime provider change.

#### Scenario: No microphone UI is implemented
- **WHEN** Qwen realtime voice provider change is complete
- **THEN** it SHALL NOT implement microphone permission prompts, recording buttons, or audio input UI

#### Scenario: No playback UI is implemented
- **WHEN** Qwen realtime voice provider change is complete
- **THEN** it SHALL NOT implement audio playback controls

#### Scenario: Text demo remains independent
- **WHEN** realtime provider change is complete
- **THEN** existing text practice demo SHALL continue to run with mock provider by default
