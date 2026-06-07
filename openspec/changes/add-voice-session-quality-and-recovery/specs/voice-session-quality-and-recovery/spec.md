## ADDED Requirements

### Requirement: Voice Session Health State
The system SHALL define health state for realtime voice sessions.

#### Scenario: Health states are finite
- **WHEN** voice session health is validated
- **THEN** it SHALL be one of `healthy`, `degraded`, `recovering`, `fallback_text`, or `failed`

#### Scenario: Degraded state allows continuation
- **WHEN** a recoverable issue occurs
- **THEN** health state MAY become `degraded` while voice session continues

#### Scenario: Fallback text is explicit
- **WHEN** voice path is unavailable but text practice can continue
- **THEN** health state SHALL become `fallback_text`

### Requirement: Voice Timeout Policy
The system SHALL define timeout types and default thresholds for voice sessions.

#### Scenario: Timeout types are finite
- **WHEN** a voice timeout is recorded
- **THEN** type SHALL be one of `microphone_permission_timeout`, `qwen_connect_timeout`, `no_user_speech_timeout`, `no_assistant_response_timeout`, `sse_idle_timeout`, `audio_send_timeout`, or `summary_timeout`

#### Scenario: Qwen connect timeout is bounded
- **WHEN** Qwen realtime session creation exceeds configured timeout
- **THEN** recovery policy SHALL trigger retry or fallback behavior

#### Scenario: Assistant response timeout is bounded
- **WHEN** no assistant response arrives after user final transcript within configured timeout
- **THEN** recovery policy SHALL trigger safe error or fallback behavior

### Requirement: Recovery Actions
The system SHALL define finite recovery actions for voice session failures.

#### Scenario: Recovery actions are finite
- **WHEN** recovery action is produced
- **THEN** it SHALL be one of `retry_connect`, `restart_sse`, `flush_audio_queue`, `fallback_to_text`, `mark_session_failed`, `save_partial_transcript`, or `show_safe_error`

#### Scenario: Automatic recovery is bounded
- **WHEN** the same recoverable failure repeats
- **THEN** recovery policy SHALL NOT retry indefinitely

#### Scenario: Partial transcript can be saved
- **WHEN** voice path fails after transcript exists
- **THEN** recovery policy SHALL be able to save partial transcript without saving raw audio

### Requirement: SSE Disconnect Handling
The system SHALL define SSE disconnect recovery behavior.

#### Scenario: First SSE disconnect restarts stream
- **WHEN** SSE disconnects for the first time during a session
- **THEN** recovery policy MAY use `restart_sse`

#### Scenario: Repeated SSE disconnect falls back
- **WHEN** SSE disconnect repeats within one session
- **THEN** recovery policy SHALL use `fallback_to_text` or `mark_session_failed`

### Requirement: Qwen WebSocket Failure Handling
The system SHALL define recovery behavior for Qwen WebSocket failures.

#### Scenario: Qwen connection failure can retry once
- **WHEN** Qwen WebSocket connection fails initially
- **THEN** recovery policy MAY use `retry_connect` once

#### Scenario: Repeated Qwen failure falls back
- **WHEN** Qwen connection still fails after retry
- **THEN** recovery policy SHALL use `fallback_to_text` or `mark_session_failed`

#### Scenario: WebSocket close is handled safely
- **WHEN** Qwen WebSocket closes unexpectedly
- **THEN** recovery policy SHALL update health and produce safe user-facing action

### Requirement: Empty Transcript Handling
The system SHALL define behavior when audio input produces no transcript.

#### Scenario: No transcript after audio input falls back
- **WHEN** audio chunks were sent but no transcript is produced within timeout
- **THEN** recovery policy SHALL use `fallback_to_text` or `show_safe_error`

#### Scenario: Empty transcript can trigger badcase
- **WHEN** no transcript after audio input occurs
- **THEN** system SHALL be able to emit a badcase signal without raw audio

### Requirement: Safe User Messages
The system SHALL provide user-facing messages for voice recovery states.

#### Scenario: Message avoids provider secrets
- **WHEN** a recovery message is shown to user
- **THEN** it SHALL NOT include API key, Authorization header, provider secret, or raw provider config

#### Scenario: Fallback message is actionable
- **WHEN** voice path falls back to text
- **THEN** user-facing message SHALL clearly explain that text practice is available

### Requirement: Badcase Trigger Points
The system SHALL define badcase triggers for voice session quality failures.

#### Scenario: Provider failures trigger safe badcase
- **WHEN** Qwen connection failed, event parse failed, or assistant response timeout occurs
- **THEN** system SHALL be able to emit a badcase signal with safe evidence summary

#### Scenario: Fallback can trigger badcase
- **WHEN** voice session falls back to text mode
- **THEN** system SHALL be able to emit a badcase signal with session and scenario attribution

#### Scenario: Raw audio is excluded
- **WHEN** voice quality badcase signal is created
- **THEN** it SHALL NOT include raw audio blob, audio bytes, recording file, API key, or provider secret

### Requirement: No Heavy Recovery Infrastructure
The system SHALL avoid heavy recovery infrastructure in this change.

#### Scenario: No persistent retry queue
- **WHEN** voice recovery is implemented
- **THEN** it SHALL NOT require server-side persistent retry queue

#### Scenario: No network dashboard
- **WHEN** voice recovery is implemented
- **THEN** it SHALL NOT implement network quality dashboard
