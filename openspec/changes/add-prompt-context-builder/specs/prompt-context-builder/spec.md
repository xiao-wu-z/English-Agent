## ADDED Requirements

### Requirement: Prompt Context Bundle
The system SHALL define a structured prompt context bundle that preserves Tier 1, Tier 2, and Tier 3 boundaries.

#### Scenario: Bundle contains three tiers
- **WHEN** prompt context is built
- **THEN** the bundle SHALL include Tier 1 core coach rules, Tier 2 scenario and active skill context, and Tier 3 runtime context

#### Scenario: Bundle includes expected output schema name
- **WHEN** prompt context is built for an Agent Skill request
- **THEN** the bundle SHALL include the expected output schema name

#### Scenario: Bundle includes metadata
- **WHEN** prompt context is built
- **THEN** the bundle SHALL include metadata for scenario id, scenario version, skill id, included tiers, recent turn count, badcase hint count, estimated chars, and expected output schema name

### Requirement: Provider-Neutral Prompt Message
The system SHALL define provider-neutral prompt messages.

#### Scenario: Prompt message has role and content only
- **WHEN** prompt messages are rendered
- **THEN** each message SHALL include only role and content

#### Scenario: Provider details are excluded
- **WHEN** prompt messages are rendered
- **THEN** they SHALL NOT include provider name, model name, endpoint, API key, transport, temperature, or max token settings

### Requirement: Three-Tier Rendering
The system SHALL render prompt context bundles into deterministic provider-neutral messages.

#### Scenario: Tier 1 renders as system message
- **WHEN** messages are rendered
- **THEN** Tier 1 core coach rules SHALL be included in a system message

#### Scenario: Tier 2 renders scenario and active skill
- **WHEN** messages are rendered
- **THEN** Tier 2 SHALL include scenario prompt context and the active skill instruction

#### Scenario: Tier 3 renders runtime context
- **WHEN** messages are rendered
- **THEN** Tier 3 SHALL include conversation memory snapshot, relevant badcase hints, and current task input

### Requirement: Core Rules Priority
The system SHALL preserve Tier 1 priority over Tier 2 and Tier 3.

#### Scenario: Runtime context cannot override core rules
- **WHEN** Tier 3 includes badcase hints or current task input
- **THEN** those inputs SHALL be rendered as runtime guidance and SHALL NOT replace or weaken Tier 1 core coach rules

#### Scenario: Scenario context cannot override core rules
- **WHEN** Tier 2 includes scenario context
- **THEN** it SHALL NOT remove, rewrite, or weaken Tier 1 core coach rules

### Requirement: Active Single Skill Injection
The system SHALL inject only the active Agent Skill instruction.

#### Scenario: Practice request injects practice skill only
- **WHEN** prompt context is built for practice
- **THEN** it SHALL include the active practice skill instruction and SHALL NOT include assessment, correction, or summary skill instructions

#### Scenario: Summary request injects summary skill only
- **WHEN** prompt context is built for summary
- **THEN** it SHALL include the active summary skill instruction and SHALL NOT include practice, assessment, or correction skill instructions

### Requirement: Conversation Memory Snapshot Usage
The system SHALL use conversation memory snapshots instead of full transcripts by default.

#### Scenario: Snapshot supplies recent turns
- **WHEN** prompt context is built with conversation memory
- **THEN** it SHALL include recent turns from `ConversationMemorySnapshot`

#### Scenario: Full transcript is not required
- **WHEN** prompt context is built
- **THEN** it SHALL NOT require the full practice session turns collection

### Requirement: Context Limits
The system SHALL limit runtime context size deterministically.

#### Scenario: Recent turns are limited
- **WHEN** a memory snapshot contains more recent turns than the configured limit
- **THEN** the builder SHALL include no more than the configured number of turns

#### Scenario: Badcase hints are limited
- **WHEN** more badcase hints are provided than the configured limit
- **THEN** the builder SHALL include no more than the configured number of hints

#### Scenario: Invalid limits fail
- **WHEN** recent turn limit or badcase hint limit is zero or negative
- **THEN** the builder SHALL fail option validation

### Requirement: Prompt Metadata
The system SHALL provide prompt metadata for debugging and observability.

#### Scenario: Metadata counts included runtime context
- **WHEN** prompt context is built
- **THEN** metadata SHALL include recent turn count and badcase hint count after limits are applied

#### Scenario: Metadata estimates prompt size
- **WHEN** prompt context is built
- **THEN** metadata SHALL include an estimated character count for rendered prompt content

#### Scenario: Metadata excludes transcript text
- **WHEN** metadata is returned
- **THEN** it SHALL NOT include full transcript text, API keys, provider secrets, or raw model output

### Requirement: Provider-Neutral Safety
The system SHALL reject prompt inputs that contain provider, model, API key, or transport implementation details.

#### Scenario: Provider details in prompt input fail validation
- **WHEN** prompt-facing inputs include Qwen, Tongyi, OpenAI, DashScope, WebRTC, WebSocket, model, endpoint, or API key details
- **THEN** prompt context building SHALL fail before rendering messages

#### Scenario: Provider selection remains outside builder
- **WHEN** a model provider is selected later
- **THEN** that selection SHALL happen in provider adapter configuration, not in prompt context builder

### Requirement: No Model Execution
The system SHALL NOT execute models from prompt context builder.

#### Scenario: Builder does not call providers
- **WHEN** prompt context is built or rendered
- **THEN** it SHALL NOT call Qwen, OpenAI, mock provider, or any other model provider

#### Scenario: Builder does not validate model output
- **WHEN** prompt context is built
- **THEN** it SHALL NOT parse or validate provider output
