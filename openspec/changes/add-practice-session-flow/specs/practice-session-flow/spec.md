## ADDED Requirements

### Requirement: Practice Session Lifecycle
The system SHALL define a runtime-verifiable lifecycle for an English practice session.

#### Scenario: Session starts from created state
- **WHEN** a practice session is created
- **THEN** its initial status SHALL be `created`
- **AND** it SHALL include session id, scenario id, scenario version, createdAt, and empty turns

#### Scenario: Session can become active
- **WHEN** a created session starts
- **THEN** it SHALL transition from `created` to `active`

#### Scenario: Session can complete normally
- **WHEN** an active session is ending and its final summary is available
- **THEN** it SHALL transition from `ending` to `completed`

#### Scenario: Session can be abandoned by the user
- **WHEN** a user cancels, closes, or abandons a created or active session
- **THEN** the session SHALL transition to `abandoned`
- **AND** it SHALL NOT require a final summary

#### Scenario: Session can fail because of system errors
- **WHEN** provider, schema, storage, or orchestration errors prevent the session from continuing
- **THEN** the session SHALL transition to `failed`
- **AND** it SHALL include a failure reason

### Requirement: Session State Transitions
The system SHALL reject invalid session state transitions.

#### Scenario: Allowed transitions are enforced
- **WHEN** session state transition validation runs
- **THEN** it SHALL allow only `created -> active`, `created -> abandoned`, `active -> ending`, `active -> abandoned`, `active -> failed`, `ending -> completed`, and `ending -> failed`

#### Scenario: Invalid transitions fail clearly
- **WHEN** an invalid transition is requested
- **THEN** the system SHALL throw a clear error that includes the source and target statuses

### Requirement: Practice Turn
The system SHALL define a turn schema for each learner and assistant exchange.

#### Scenario: Turn records transcript text
- **WHEN** a practice turn is recorded
- **THEN** it SHALL include turn id, session id, startedAt, endedAt, user text, and AI text

#### Scenario: Turn supports learning attribution
- **WHEN** a turn targets a specific scenario goal
- **THEN** it SHALL be able to include target goal id

#### Scenario: Turn supports skill outputs
- **WHEN** practice, correction, or assessment skills produce turn-level data
- **THEN** the turn SHALL be able to include candidate issues, turn assessment, and realtime correction

### Requirement: Full Transcript Storage
The system SHALL keep complete session turns for local history and post-session review.

#### Scenario: Session stores full turn history
- **WHEN** turns are completed during a practice session
- **THEN** they SHALL be retained in the session's `turns` collection

#### Scenario: Full transcript is not the default prompt input
- **WHEN** future prompt runtime asks for conversation context
- **THEN** it SHALL receive a memory snapshot instead of the entire turns collection by default

### Requirement: Rolling Summary
The system SHALL define a structured rolling summary for long conversation memory.

#### Scenario: Rolling summary captures compressed learning context
- **WHEN** a rolling summary exists
- **THEN** it SHALL include covered goals, unresolved issues, learner patterns, conversation facts, correction focus, last updated turn id, and updatedAt

#### Scenario: Rolling summary is optional before compression
- **WHEN** a short session has not required compression
- **THEN** the session SHALL be valid without rolling summary

### Requirement: Conversation Memory Snapshot
The system SHALL define a prompt-safe runtime memory snapshot.

#### Scenario: Snapshot contains rolling summary and recent turns
- **WHEN** a conversation memory snapshot is built
- **THEN** it SHALL include optional rolling summary, recent turns, and optional current user input

#### Scenario: Snapshot limits recent turns
- **WHEN** a session contains more turns than the configured recent-turn limit
- **THEN** the snapshot SHALL include only the most recent turns up to that limit

#### Scenario: Snapshot does not mutate session history
- **WHEN** a memory snapshot is built
- **THEN** the original session turns SHALL remain unchanged

### Requirement: Conversation Compression Trigger
The system SHALL define deterministic rules for when long conversation compression is needed.

#### Scenario: Turn count can trigger compression
- **WHEN** a session contains more than eight turns
- **THEN** `shouldCompressConversation` SHALL return true

#### Scenario: Character count can trigger compression
- **WHEN** estimated transcript characters exceed 12000
- **THEN** `shouldCompressConversation` SHALL return true

#### Scenario: Short conversations do not trigger compression
- **WHEN** a session is below both turn and character thresholds
- **THEN** `shouldCompressConversation` SHALL return false

### Requirement: Practice Session Repository Interface
The system SHALL define a repository interface for local practice session history.

#### Scenario: Repository supports core session operations
- **WHEN** a practice session repository is implemented
- **THEN** it SHALL support saving a session, getting a session by id, listing sessions, updating a session, and deleting a session

#### Scenario: Repository abstraction avoids storage lock-in
- **WHEN** application code persists session history
- **THEN** it SHALL depend on the repository interface rather than directly depending on localStorage, IndexedDB, or a server database

### Requirement: Practice Session Events
The system SHALL define event types for session orchestration and future integrations.

#### Scenario: Session and turn events are defined
- **WHEN** practice session flow code emits or handles events
- **THEN** it SHALL support `session.started`, `turn.completed`, `correction.dismissed`, `session.ending`, `summary.completed`, `session.abandoned`, `session.failed`, and `provider.schema_failed`

#### Scenario: Events include attribution
- **WHEN** a session event is created
- **THEN** it SHALL include event id, session id, scenario id, scenario version, event type, and createdAt

#### Scenario: Turn-related events include turn id
- **WHEN** an event is related to a specific turn
- **THEN** it SHALL be able to include turn id

### Requirement: Three-Tier Prompt Role
The system SHALL define practice session memory as Tier 3 runtime context.

#### Scenario: Memory snapshot is runtime context
- **WHEN** future prompt runtime builds model context
- **THEN** it SHALL place `ConversationMemorySnapshot` in Tier 3 with runtime state

#### Scenario: Full transcript is not Tier 1 or Tier 2
- **WHEN** future prompt runtime builds core coach rules, scenario context, or active skill context
- **THEN** it SHALL NOT place the complete transcript in Tier 1 or Tier 2

### Requirement: No Model Compression In This Change
The system SHALL NOT call a model to generate rolling summaries in this change.

#### Scenario: Compression trigger does not call provider
- **WHEN** `shouldCompressConversation` returns true
- **THEN** this change SHALL NOT call Qwen, OpenAI, mock provider, or any other model provider

#### Scenario: Future compression remains separately scoped
- **WHEN** rolling summary generation is implemented later
- **THEN** it SHALL be handled by a separate change such as conversation memory compression
