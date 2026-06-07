## ADDED Requirements

### Requirement: Voice Recovery Timers
The system SHALL run UI timers for realtime voice recovery.

#### Scenario: Microphone permission timeout
- **WHEN** microphone permission is not resolved within the configured timeout
- **THEN** the system SHALL show a Chinese safe fallback message

#### Scenario: SSE idle timeout
- **WHEN** no SSE event arrives within the configured idle timeout
- **THEN** the system SHALL decide whether to restart SSE or fallback to text

#### Scenario: No transcript timeout
- **WHEN** audio was sent but no user transcript arrives within the configured timeout
- **THEN** the system SHALL fallback to text and record a safe recovery signal

#### Scenario: Assistant response timeout
- **WHEN** user transcript is final but assistant transcript does not arrive within the configured timeout
- **THEN** the system SHALL show a safe error and allow text practice

### Requirement: Timer Cleanup
The system SHALL clean up voice recovery timers.

#### Scenario: Session ends
- **WHEN** the user ends or cancels a voice session
- **THEN** all voice recovery timers SHALL be cleared

#### Scenario: Fallback to text
- **WHEN** voice mode falls back to text
- **THEN** all active recording resources and recovery timers SHALL be cleared

### Requirement: Recovery UI Safety
The system SHALL keep recovery messages safe.

#### Scenario: Recovery message is shown
- **WHEN** a timeout or recovery action occurs
- **THEN** the message SHALL NOT include raw audio, API key, Authorization header, provider secret, or raw provider config
