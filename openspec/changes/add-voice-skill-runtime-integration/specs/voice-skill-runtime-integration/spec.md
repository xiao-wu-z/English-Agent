## ADDED Requirements

### Requirement: Voice Transcript Skill Input
The system SHALL use final user voice transcripts as inputs to the existing skill runtime.

#### Scenario: Final transcript creates a practice turn
- **WHEN** Qwen emits `transcript.user.final`
- **THEN** the system SHALL create a voice practice turn using the transcript text

#### Scenario: Partial transcript is not persisted
- **WHEN** Qwen emits partial transcript events
- **THEN** the system SHALL use them for UI preview only and SHALL NOT persist them as final practice turns

### Requirement: Voice Realtime Correction
The system SHALL generate realtime correction from voice transcripts.

#### Scenario: High confidence correction is shown
- **WHEN** a final voice transcript has a high-confidence low-risk issue
- **THEN** the system SHALL show at most one Chinese realtime correction

### Requirement: Voice Summary And Assessment
The system SHALL produce summary and assessment for completed voice sessions.

#### Scenario: Voice session ends
- **WHEN** the user ends a voice practice session
- **THEN** the system SHALL run assessment and summary skills over final transcripts

### Requirement: Voice Data Safety
The system SHALL persist only safe text data from voice sessions.

#### Scenario: Voice history is saved
- **WHEN** voice practice history is saved
- **THEN** it SHALL include final transcripts and skill outputs but SHALL NOT include raw audio, base64 audio, hidden reasoning, API key, or provider secret
