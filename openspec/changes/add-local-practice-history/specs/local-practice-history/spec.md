## ADDED Requirements

### Requirement: Local Practice History Storage
The system SHALL define local practice history storage for MVP sessions.

#### Scenario: Storage key is stable
- **WHEN** local practice history is persisted
- **THEN** it SHALL use storage key `english-agent.practice-sessions.v1`

#### Scenario: Storage payload has version
- **WHEN** local practice history payload is stored
- **THEN** it SHALL include `version: 1`, sessions, and updatedAt

#### Scenario: Storage contains practice sessions
- **WHEN** a completed, abandoned, failed, active, or ending practice session is saved
- **THEN** it SHALL be stored as a practice session payload validated by the practice session schema

### Requirement: Local Practice Session Repository
The system SHALL provide a localStorage implementation boundary for the practice session repository.

#### Scenario: Repository saves session
- **WHEN** saveSession is called with a valid practice session
- **THEN** the repository SHALL persist it in local practice history storage

#### Scenario: Repository gets session by id
- **WHEN** getSession is called with an existing session id
- **THEN** the repository SHALL return that session
- **WHEN** getSession is called with a missing session id
- **THEN** it SHALL return undefined

#### Scenario: Repository lists sessions
- **WHEN** listSessions is called
- **THEN** the repository SHALL return practice session list items rather than requiring callers to read full transcript data

#### Scenario: Repository updates session
- **WHEN** updateSession is called with an existing session
- **THEN** the repository SHALL replace the stored session and update storage metadata

#### Scenario: Repository deletes session
- **WHEN** deleteSession is called
- **THEN** the repository SHALL remove the session if present
- **AND** deleting a missing session SHALL be idempotent

### Requirement: Practice Session List Item
The system SHALL define a compact history list item.

#### Scenario: List item contains summary fields
- **WHEN** a practice session is converted to a list item
- **THEN** it SHALL include id, scenario id, scenario version, status, startedAt, optional endedAt, turn count, optional overall score, optional summary preview, and updatedAt

#### Scenario: List item can include Chinese scenario title
- **WHEN** scenario display metadata is available
- **THEN** the list item SHALL be able to include scenarioTitleZh

#### Scenario: List item excludes full transcript
- **WHEN** a list item is returned
- **THEN** it SHALL NOT include the full turns collection

### Requirement: History Capacity Policy
The system SHALL apply deterministic pruning to local practice history.

#### Scenario: Total sessions are capped
- **WHEN** more than 50 sessions would be stored
- **THEN** the repository SHALL prune sessions until no more than 50 remain

#### Scenario: Failed sessions are capped
- **WHEN** more than 10 failed sessions would be stored
- **THEN** the repository SHALL keep only the 10 most recent failed sessions

#### Scenario: Completed and abandoned sessions prune first
- **WHEN** total session pruning is required
- **THEN** the repository SHALL prefer pruning the oldest completed or abandoned sessions before pruning active or ending sessions

### Requirement: Safe Local History Data
The system SHALL prevent sensitive data and hidden reasoning from being persisted in local practice history.

#### Scenario: Raw audio is not persisted
- **WHEN** a session is saved
- **THEN** local practice history SHALL NOT store raw audio blobs, raw audio bytes, or audio recording files

#### Scenario: Provider secrets are not persisted
- **WHEN** a session is saved
- **THEN** local practice history SHALL NOT store API keys, provider secrets, Authorization headers, provider raw secret config, or secret environment values

#### Scenario: Hidden reasoning is not persisted
- **WHEN** a session is saved
- **THEN** local practice history SHALL NOT store hidden reasoning, chain-of-thought, reasoning trace, or thought fields

### Requirement: Local History Errors
The system SHALL expose explicit local practice history storage errors.

#### Scenario: Parse failure is explicit
- **WHEN** stored local practice history JSON cannot be parsed
- **THEN** repository operations SHALL fail with `parse_failed`

#### Scenario: Schema validation failure is explicit
- **WHEN** stored payload or saved session fails schema validation
- **THEN** repository operations SHALL fail with `schema_validation_failed`

#### Scenario: Quota failure is explicit
- **WHEN** browser storage quota prevents writing
- **THEN** repository operations SHALL fail with `quota_exceeded`

#### Scenario: Storage unavailable is explicit
- **WHEN** localStorage is unavailable
- **THEN** repository operations SHALL fail with `storage_unavailable`

### Requirement: Separation From Badcase Log
The system SHALL keep local practice history separate from badcase storage.

#### Scenario: Practice history does not write badcase JSONL
- **WHEN** a practice session is saved in local history
- **THEN** it SHALL NOT write to file-based badcase JSONL files

#### Scenario: Badcase log does not replace practice history
- **WHEN** a badcase signal is recorded elsewhere
- **THEN** it SHALL NOT be treated as a replacement for session history storage

### Requirement: No Heavy Storage In This Change
The system SHALL avoid non-local storage infrastructure in this change.

#### Scenario: No server database is required
- **WHEN** local practice history is implemented
- **THEN** it SHALL NOT require SQLite, Redis, MySQL, cloud database, or external service

#### Scenario: IndexedDB is not implemented
- **WHEN** this change is complete
- **THEN** it SHALL NOT implement IndexedDB storage

#### Scenario: No model call is required
- **WHEN** local practice history is saved, read, listed, updated, or deleted
- **THEN** it SHALL NOT call Qwen, OpenAI, mock provider, or any other model provider
