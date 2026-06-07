## ADDED Requirements

### Requirement: Agent Skill Runtime
The system SHALL provide an Agent Skill Runtime that turns a task, scenario, and runtime state into a provider-neutral skill run request.

#### Scenario: Skill runtime returns request without model call
- **WHEN** application code runs an Agent Skill task
- **THEN** the runtime SHALL return a `SkillRunRequest`
- **AND** it SHALL NOT call Qwen, OpenAI, DashScope, WebRTC, WebSocket, or any other model provider

#### Scenario: Runtime depends on scenario prompt context
- **WHEN** the runtime builds a skill run request
- **THEN** it SHALL consume the `ScenarioPromptContext` from the scenario catalog rather than raw scenario JSON

### Requirement: Three-Tier Prompt Context
The system SHALL build prompt messages using a three-tier context architecture.

#### Scenario: Tier 1 contains core coach rules
- **WHEN** the runtime builds messages
- **THEN** Tier 1 SHALL include the English speaking coach identity, core redlines, and system boundaries

#### Scenario: Tier 2 contains one active skill and scenario context
- **WHEN** the runtime builds messages for a task
- **THEN** Tier 2 SHALL include the current scenario prompt context and only the active Agent Skill document for that task

#### Scenario: Tier 3 contains runtime state
- **WHEN** the runtime builds messages
- **THEN** Tier 3 SHALL include session id, phase, active goal, recent transcript, candidate issues, assessment results, and correction items when available

### Requirement: Single Skill Progressive Loading
The system SHALL load only the active Agent Skill document needed for the requested task.

#### Scenario: Practice task loads practice skill only
- **WHEN** the runtime builds a practice task request
- **THEN** it SHALL load `agent-skills/english-practice/SKILL.md`
- **AND** it SHALL NOT include assessment, correction, or summary Skill documents

#### Scenario: Summary task loads summary skill only
- **WHEN** the runtime builds a summary task request
- **THEN** it SHALL load `agent-skills/english-summary/SKILL.md`
- **AND** it SHALL NOT include practice, assessment, or correction Skill documents

### Requirement: Skill Registry And Handler Shells
The system SHALL define a static Agent Skill registry and handler shells for the four default English Agent Skills.

#### Scenario: Default skills are registered
- **WHEN** the runtime initializes
- **THEN** it SHALL register `english-practice`, `english-assessment`, `english-correction`, and `english-summary`

#### Scenario: Handler metadata is available
- **WHEN** the runtime resolves a skill
- **THEN** it SHALL know the skill task, provider mode, expected output schema, and instruction builder

#### Scenario: Unknown skill fails clearly
- **WHEN** the runtime is asked to run an unknown skill id
- **THEN** it SHALL throw a clear error before building model messages

### Requirement: Provider-Neutral SkillRunRequest
The system SHALL output a provider-neutral request that later provider adapters can execute.

#### Scenario: SkillRunRequest has task and schema metadata
- **WHEN** a skill run request is produced
- **THEN** it SHALL include task, skill id, provider mode, prompt messages, and expected output schema

#### Scenario: Provider details are excluded
- **WHEN** a skill run request is produced
- **THEN** it SHALL NOT include API keys, provider-specific endpoints, model names, or transport implementation details

### Requirement: Runtime State Schema
The system SHALL validate runtime prompt state before building a skill run request.

#### Scenario: Runtime state validates transcript
- **WHEN** runtime state includes recent transcript
- **THEN** transcript turns SHALL have stable ids, roles, text, and timestamps

#### Scenario: Runtime state can include prior skill outputs
- **WHEN** runtime state includes candidate issues, assessment results, or correction items
- **THEN** those values SHALL conform to the existing agent skill output contracts

### Requirement: Task And Skill Binding Validation
The system SHALL ensure the requested task matches the scenario's skill binding and the resolved handler type.

#### Scenario: Scenario binding selects active skill
- **WHEN** a task is requested for a scenario
- **THEN** the runtime SHALL resolve the active skill id from the scenario skill binding for that task

#### Scenario: Mismatched handler is rejected
- **WHEN** a skill handler's task does not match the requested task
- **THEN** the runtime SHALL reject the request with a clear error
