## ADDED Requirements

### Requirement: PCM16 Browser Audio Encoding
The system SHALL encode browser microphone audio into PCM16 mono 16 kHz chunks for Qwen realtime input.

#### Scenario: Float32 audio is encoded to PCM16
- **WHEN** browser capture produces Float32 audio frames
- **THEN** the system SHALL clamp samples to [-1, 1] and encode them as Int16 PCM bytes

#### Scenario: Stereo input is mixed down
- **WHEN** microphone input has more than one channel
- **THEN** the system SHALL mix channels down to mono before sending audio

#### Scenario: Audio is resampled to 16 kHz
- **WHEN** the browser AudioContext sample rate is not 16000 Hz
- **THEN** the system SHALL resample audio to 16000 Hz before sending it to Qwen

### Requirement: PCM Audio Chunk Metadata
The system SHALL send PCM chunks with provider-compatible metadata.

#### Scenario: PCM metadata includes required fields
- **WHEN** a PCM chunk is sent to the audio route
- **THEN** metadata SHALL include mimeType `audio/pcm;rate=16000`, sequence, byteLength, sampleRate 16000, and channels 1

#### Scenario: Empty PCM chunk is rejected
- **WHEN** PCM encoding produces an empty chunk
- **THEN** the system SHALL reject the chunk before sending it to Qwen

### Requirement: AudioWorklet Capture Lifecycle
The system SHALL manage browser PCM capture lifecycle safely.

#### Scenario: PCM capture starts
- **WHEN** voice mode starts recording and browser PCM capture is supported
- **THEN** the system SHALL create an AudioContext, attach an AudioWorklet processor, and begin streaming PCM chunks

#### Scenario: PCM capture stops
- **WHEN** the user stops or cancels voice recording
- **THEN** the system SHALL stop MediaStream tracks and close AudioContext resources

#### Scenario: PCM capture unsupported
- **WHEN** AudioContext or AudioWorklet is unavailable
- **THEN** the system SHALL fallback to MediaRecorder or text practice with a Chinese safe message

### Requirement: Qwen Realtime PCM Compatibility
The system SHALL route PCM chunks through the existing Qwen realtime provider.

#### Scenario: PCM chunk is accepted by adapter
- **WHEN** the audio route receives `audio/pcm;rate=16000`
- **THEN** the audio format adapter SHALL allow forwarding to Qwen provider

#### Scenario: Qwen receives base64 PCM append
- **WHEN** the Qwen provider receives PCM bytes
- **THEN** it SHALL send `input_audio_buffer.append` with base64 encoded PCM audio

### Requirement: Safe Fallback And Recovery
The system SHALL recover safely from PCM capture failures.

#### Scenario: Microphone permission fails
- **WHEN** microphone permission is denied or times out
- **THEN** the system SHALL show a Chinese safe fallback message and allow text practice

#### Scenario: PCM encoding fails
- **WHEN** PCM encoding fails
- **THEN** the system SHALL stop capture and map the failure to safe voice recovery

#### Scenario: No transcript after PCM input
- **WHEN** PCM audio was sent but no user transcript is produced within the configured timeout
- **THEN** the system SHALL map the condition to `no_transcript_after_audio`

### Requirement: Raw Audio Safety
The system SHALL avoid persisting or exposing raw audio.

#### Scenario: PCM bytes are not persisted
- **WHEN** PCM chunks are encoded, sent, rejected, or recovered
- **THEN** raw PCM bytes and base64 audio SHALL NOT be saved to local history, badcase log, prompt context, or user-visible errors

#### Scenario: Secrets are not exposed
- **WHEN** PCM capture errors or route errors are returned
- **THEN** they SHALL NOT include API key, Authorization header, provider secret, or raw provider config

### Requirement: No Server Transcoding In This Change
The system SHALL avoid server-side transcoding for PCM capture.

#### Scenario: No ffmpeg dependency
- **WHEN** PCM capture is implemented
- **THEN** it SHALL NOT require ffmpeg or server-side audio transcoding
