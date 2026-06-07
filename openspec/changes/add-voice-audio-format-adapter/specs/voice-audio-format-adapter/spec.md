## ADDED Requirements

### Requirement: Audio Chunk Metadata
The system SHALL define metadata for browser audio chunks.

#### Scenario: Metadata includes required fields
- **WHEN** audio chunk metadata is created
- **THEN** it SHALL include mimeType, sequence, and byteLength

#### Scenario: Metadata supports optional audio details
- **WHEN** sample rate, channel count, or duration is known
- **THEN** metadata SHALL be able to include sampleRate, channels, and durationMs

#### Scenario: Missing metadata fails
- **WHEN** server receives audio without required metadata
- **THEN** adapter SHALL fail with `audio_metadata_missing`

### Requirement: Browser MIME Type Detection
The system SHALL detect supported browser MediaRecorder MIME type.

#### Scenario: Preferred MIME types are checked in order
- **WHEN** browser prepares voice recording
- **THEN** it SHALL check `audio/webm;codecs=opus`, `audio/ogg;codecs=opus`, and `audio/mp4` in order

#### Scenario: First supported MIME is selected
- **WHEN** browser supports one or more preferred MIME types
- **THEN** the first supported type SHALL be selected

#### Scenario: No supported MIME falls back
- **WHEN** browser supports none of the preferred MIME types
- **THEN** voice flow SHALL trigger fallback to text mode or safe error

### Requirement: Server Audio Format Adapter
The system SHALL define server-side compatibility checks for provider audio input.

#### Scenario: Compatible chunk forwards directly
- **WHEN** audio chunk MIME type is accepted by Qwen realtime provider
- **THEN** adapter SHALL allow direct forwarding

#### Scenario: Incompatible chunk is rejected
- **WHEN** audio chunk MIME type is not accepted by provider
- **THEN** adapter SHALL fail with `unsupported_audio_format`

#### Scenario: Empty chunk is rejected
- **WHEN** byteLength is zero
- **THEN** adapter SHALL reject the chunk before forwarding

### Requirement: Audio Format Errors
The system SHALL define audio format error codes.

#### Scenario: Error codes are finite
- **WHEN** audio format error is created
- **THEN** code SHALL be one of `unsupported_audio_format`, `audio_encoding_failed`, or `audio_metadata_missing`

#### Scenario: Error excludes raw audio
- **WHEN** audio format error is returned or logged
- **THEN** it SHALL NOT include raw audio bytes, blobs, files, API key, Authorization header, or provider secret

### Requirement: Text Fallback On Unsupported Format
The system SHALL support fallback to text mode when audio format is unsupported.

#### Scenario: Unsupported format triggers fallback
- **WHEN** provider cannot accept selected browser MIME type
- **THEN** voice recovery policy SHALL be able to transition to `fallback_text`

#### Scenario: Fallback message is actionable
- **WHEN** unsupported audio format occurs
- **THEN** UI SHALL show a Chinese safe message telling the user they can continue with text practice

### Requirement: No Transcoding In This Change
The system SHALL avoid complex audio transcoding in this change.

#### Scenario: No ffmpeg dependency
- **WHEN** audio format adapter is implemented
- **THEN** it SHALL NOT require ffmpeg

#### Scenario: No AudioWorklet PCM16 implementation
- **WHEN** audio format adapter is implemented
- **THEN** it SHALL NOT implement AudioWorklet PCM16 capture

#### Scenario: No raw audio persistence
- **WHEN** audio chunks are checked or rejected
- **THEN** raw audio SHALL NOT be saved to local history or badcase log

### Requirement: Future PCM16 Extension Boundary
The system SHALL keep an extension point for future PCM16 audio capture.

#### Scenario: Adapter can support future strategies
- **WHEN** a future AudioWorklet or PCM16 strategy is added
- **THEN** it SHALL be able to plug into the audio format adapter without changing UI state contracts
