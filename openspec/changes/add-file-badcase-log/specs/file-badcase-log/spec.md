## ADDED Requirements

### Requirement: File-Based Badcase Signal
The system SHALL define a runtime-verifiable badcase signal schema for recording model, skill, and provider failure evidence.

#### Scenario: Badcase signal has attribution fields
- **WHEN** a badcase signal is created
- **THEN** it SHALL include id, kind, status, source, session id, scenario id, scenario version, skill id, createdAt, and input snapshot

#### Scenario: Badcase signal supports optional turn and goal attribution
- **WHEN** a badcase signal is related to a specific learner turn or learning goal
- **THEN** it SHALL be able to include turn id and goal id

### Requirement: Badcase Kind And File Mapping
The system SHALL map badcase kinds to category-specific JSONL files.

#### Scenario: Correction badcases map to correction file
- **WHEN** kind is `wrong_correction` or `user_dismissed_correction`
- **THEN** the signal SHALL be written to `correction.jsonl`

#### Scenario: Assessment badcases map to assessment file
- **WHEN** kind is `low_quality_assessment`
- **THEN** the signal SHALL be written to `assessment.jsonl`

#### Scenario: Summary badcases map to summary file
- **WHEN** kind is `bad_summary` or `user_regenerated`
- **THEN** the signal SHALL be written to `summary.jsonl`

#### Scenario: Provider badcases map to provider file
- **WHEN** kind is `provider_schema_failure`
- **THEN** the signal SHALL be written to `provider.jsonl`

### Requirement: JSONL Append And Read
The system SHALL append and read badcase signals using JSONL files.

#### Scenario: Append writes one line per signal
- **WHEN** a badcase signal is appended
- **THEN** the store SHALL write exactly one compact JSON object followed by a newline

#### Scenario: Read skips empty lines
- **WHEN** a badcase JSONL file contains empty lines
- **THEN** the reader SHALL skip empty lines

#### Scenario: Invalid JSON fails clearly
- **WHEN** a badcase JSONL file contains invalid JSON
- **THEN** the reader SHALL throw a clear parse error instead of silently ignoring it

### Requirement: Testable Storage Root
The system SHALL support custom badcase storage roots.

#### Scenario: Tests use temporary directory
- **WHEN** tests append or read badcase signals
- **THEN** they SHALL be able to pass a temporary root directory and SHALL NOT write to real `data/badcases`

#### Scenario: Default root is data directory
- **WHEN** no custom root is provided
- **THEN** the store SHALL use `data/badcases`

### Requirement: Badcase Hint
The system SHALL convert badcase signals into short prompt-safe hints for future Tier 3 runtime context.

#### Scenario: Hint excludes full input snapshot
- **WHEN** a badcase signal is converted to a hint
- **THEN** the hint SHALL include lesson, avoid pattern, suggested behavior, source signal id, scenario id, skill id, and kind
- **AND** it SHALL NOT include full inputSnapshot

#### Scenario: Hint is concise
- **WHEN** a badcase hint is created
- **THEN** lesson, avoid pattern, and suggested behavior SHALL be short learner-system guidance suitable for prompt injection

### Requirement: Relevant Badcase Hints
The system SHALL provide lightweight relevant badcase hint lookup without vector search.

#### Scenario: Hints can be filtered by scenario and skill
- **WHEN** relevant badcase hints are requested with scenario id and skill id
- **THEN** the store SHALL return hints matching those fields

#### Scenario: Hints can be limited
- **WHEN** relevant badcase hints are requested with a limit
- **THEN** the store SHALL return no more than that number of hints

### Requirement: Three-Tier Prompt Role
The system SHALL define badcase hints as Tier 3 runtime context, not global or skill context.

#### Scenario: Badcase hints are dynamic runtime context
- **WHEN** future prompt runtime consumes badcase hints
- **THEN** it SHALL include them in Tier 3 with runtime state

#### Scenario: Badcase hints are not Tier 1 or Tier 2
- **WHEN** future prompt runtime builds Tier 1 and Tier 2
- **THEN** it SHALL NOT place specific badcase hints in core coach rules, scenario catalog, or Agent Skill documents

### Requirement: No Heavy Badcase Infrastructure
The system SHALL avoid heavy storage and automatic judging in this change.

#### Scenario: No vector database is required
- **WHEN** file badcase log is implemented
- **THEN** it SHALL NOT require vector database, SQLite, Redis, MySQL, or external services

#### Scenario: No automatic judge is implemented
- **WHEN** file badcase log is implemented
- **THEN** it SHALL NOT call a model to judge badcases automatically
