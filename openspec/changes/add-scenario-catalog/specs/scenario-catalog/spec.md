## ADDED Requirements

### Requirement: Built-in Scenario Catalog
The system SHALL provide a validated static catalog with five built-in English speaking practice scenarios for V1.

#### Scenario: Five scenarios are available
- **WHEN** the scenario catalog is loaded
- **THEN** it SHALL contain `job-interview`, `restaurant-ordering`, `business-meeting`, `airport-travel`, and `daily-small-talk`

#### Scenario: Scenario content supports UI and prompt context
- **WHEN** a scenario is read from the catalog
- **THEN** it SHALL include English prompt-facing content and Chinese UI-facing title and description fields

### Requirement: Scenario Schema
The system SHALL define a runtime-verifiable schema for practice scenarios.

#### Scenario: Scenario required fields are validated
- **WHEN** a scenario file is parsed
- **THEN** the system SHALL validate id, version, title, titleZh, description, descriptionZh, difficulty, context, goals, constraints, skillBindings, and promptHints

#### Scenario: Scenario version is available for attribution
- **WHEN** downstream code consumes a scenario
- **THEN** it SHALL have access to `scenarioId` and `scenarioVersion` for history, summary, and badcase attribution

#### Scenario: Goals are stable and unique
- **WHEN** a scenario defines learner goals
- **THEN** each goal SHALL have a stable id, label, and success criteria, and goal ids SHALL be unique within that scenario

### Requirement: Agent Skill Binding
The system SHALL bind each scenario to the four existing English Agent Skills without making the scenario responsible for workflow control.

#### Scenario: Default skill bindings are present
- **WHEN** a built-in scenario is loaded
- **THEN** it SHALL bind practice to `english-practice`, assessment to `english-assessment`, correction to `english-correction`, and summary to `english-summary`

#### Scenario: Unknown skill ids are rejected
- **WHEN** a scenario references an unknown Agent Skill id
- **THEN** catalog validation SHALL fail before the scenario is exposed to application code

### Requirement: Provider-Neutral Scenario Content
The system SHALL keep scenario content independent from model provider and transport implementation details.

#### Scenario: Provider names are not embedded in scenarios
- **WHEN** a scenario file is validated
- **THEN** prompt-facing scenario content SHALL NOT include provider or transport names such as Qwen, Tongyi, OpenAI, DashScope, WebRTC, WebSocket, model, or API key

#### Scenario: Provider selection remains outside scenario catalog
- **WHEN** later code chooses Qwen, OpenAI, or mock providers
- **THEN** that choice SHALL be made through provider adapter configuration, not through scenario fields

### Requirement: Scenario Catalog API
The system SHALL expose a single catalog API so callers do not import raw JSON scenario files directly.

#### Scenario: All scenarios can be listed
- **WHEN** application code calls `getAllScenarios`
- **THEN** it SHALL receive the validated built-in scenarios

#### Scenario: Scenario lookup can be optional or strict
- **WHEN** application code calls `getScenarioById`
- **THEN** it SHALL receive the matching scenario or undefined
- **WHEN** application code calls `assertScenarioById` with an unknown id
- **THEN** it SHALL throw a clear error

#### Scenario: Difficulty filtering is supported
- **WHEN** application code calls `getScenariosByDifficulty`
- **THEN** it SHALL receive only scenarios matching the requested difficulty

### Requirement: Scenario Prompt Context
The system SHALL provide a structured Scenario Prompt Context for the future three-tier Prompt Builder.

#### Scenario: Scenario is transformed into Tier 2 context
- **WHEN** application code calls `toScenarioPromptContext`
- **THEN** it SHALL receive provider-neutral setting, roles, learner purpose, goals, constraints, vocabulary, sample user intents, tone, scenario id, and scenario version

#### Scenario: Prompt builder is not implemented by this change
- **WHEN** this change is complete
- **THEN** it SHALL provide Scenario Prompt Context data only and SHALL NOT build full model prompts or call any model provider

### Requirement: Catalog Validation
The system SHALL validate catalog-level invariants before exposing scenarios.

#### Scenario: Duplicate scenario ids are rejected
- **WHEN** two scenarios share the same id
- **THEN** catalog validation SHALL fail with a clear error

#### Scenario: English prompt-facing fields are enforced
- **WHEN** prompt-facing fields such as opening message, learner goals, constraints, vocabulary, or sample user intents contain non-English content
- **THEN** catalog validation SHALL fail

#### Scenario: Session duration is bounded
- **WHEN** a scenario sets `maxSessionMinutes`
- **THEN** the value SHALL be within the V1 supported range of 3 to 20 minutes
