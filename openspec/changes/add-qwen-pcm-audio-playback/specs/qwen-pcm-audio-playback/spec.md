## ADDED Requirements

### Requirement: Qwen PCM Audio Playback
The system SHALL play Qwen realtime assistant audio deltas when available.

#### Scenario: Audio delta is decoded
- **WHEN** SSE receives an `audio.delta` event with `pcm/base64`
- **THEN** the system SHALL decode it into PCM samples

#### Scenario: PCM audio is played
- **WHEN** decoded assistant PCM samples are available
- **THEN** the system SHALL play them using Web Audio at 24 kHz

### Requirement: Transcript-Only Fallback
The system SHALL continue voice practice when audio playback fails.

#### Scenario: Playback fails
- **WHEN** audio playback cannot start or decode
- **THEN** the system SHALL continue showing assistant transcript and show a safe fallback message

### Requirement: Output Audio Safety
The system SHALL not persist Qwen output audio.

#### Scenario: Assistant audio received
- **WHEN** output audio deltas are received or played
- **THEN** raw audio and base64 audio SHALL NOT be saved to local history, badcase log, prompt context, or user-visible errors
