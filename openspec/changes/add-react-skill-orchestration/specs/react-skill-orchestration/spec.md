## ADDED Requirements

### Requirement: Bounded ReAct Run
The system SHALL define a bounded ReAct orchestration run for Agent Skill execution.

#### Scenario: Run has attribution fields
- **WHEN** a ReAct run is created
- **THEN** it SHALL include run id, session id, scenario id, scenario version, skill id, task, status, policy, steps, createdAt, and updatedAt

#### Scenario: Run uses bounded policy
- **WHEN** a ReAct run is created without custom policy
- **THEN** it SHALL use maxSteps 5, maxRetriesPerStep 1, and maxProviderFailures 2

#### Scenario: Run does not exceed max steps
- **WHEN** a ReAct run reaches the configured maxSteps
- **THEN** orchestration SHALL stop adding new steps

### Requirement: ReAct Step
The system SHALL define safe ReAct step records without hidden chain-of-thought.

#### Scenario: Step records structured execution metadata
- **WHEN** a ReAct step is recorded
- **THEN** it SHALL include id, run id, index, type, status, skill id, input summary, output summary, startedAt, and optional endedAt

#### Scenario: Step supports confidence and risk labels
- **WHEN** a step has quality information
- **THEN** it SHALL be able to include confidence label and risk level

#### Scenario: Hidden reasoning fields are rejected
- **WHEN** a step includes thought, chainOfThought, reasoningTrace, or similar hidden reasoning fields
- **THEN** schema validation SHALL reject it

### Requirement: ReAct Step Types
The system SHALL support the MVP bounded ReAct step types.

#### Scenario: MVP step types are available
- **WHEN** a ReAct step type is validated
- **THEN** it SHALL allow observe, act, assess, decide, and final

#### Scenario: Unknown step type fails
- **WHEN** an unknown step type is provided
- **THEN** schema validation SHALL fail

### Requirement: Quality Gate
The system SHALL require quality assessment before user-visible decisions.

#### Scenario: Skill output is assessed before display
- **WHEN** an Agent Skill output may be shown to the learner
- **THEN** orchestration SHALL evaluate confidence, risk, scenario relevance, role alignment, pedagogical value, and hallucination risk before deciding to show it

#### Scenario: High hallucination risk stops display
- **WHEN** quality assessment reports high hallucination risk
- **THEN** decision SHALL NOT be show
- **AND** the run SHALL stop or safely degrade

#### Scenario: Low confidence is not blindly retried
- **WHEN** quality assessment reports low confidence without schema or provider failure
- **THEN** orchestration SHALL prefer suppress or defer_to_summary instead of unlimited retry

### Requirement: ReAct Decision
The system SHALL define finite decisions for orchestration outcomes.

#### Scenario: Decision action is finite
- **WHEN** a ReAct decision is created
- **THEN** action SHALL be one of show, suppress, retry, defer_to_summary, ask_clarifying_question, log_badcase, or final

#### Scenario: Decision reason code is finite
- **WHEN** a ReAct decision is created
- **THEN** reason code SHALL be one of high_confidence, low_confidence, schema_validation_failed, high_hallucination_risk, provider_failed, max_steps_reached, session_not_active, user_abandoned, or policy_stop

#### Scenario: Max steps decision is safe
- **WHEN** max steps are reached without safe final output
- **THEN** decision SHALL use max_steps_reached and SHALL NOT continue the loop

### Requirement: Retry Limits
The system SHALL limit retries in ReAct orchestration.

#### Scenario: Schema validation failure can retry once
- **WHEN** provider output fails expected schema validation
- **THEN** orchestration MAY retry only up to maxRetriesPerStep

#### Scenario: Retry limit stops further retry
- **WHEN** maxRetriesPerStep has been reached
- **THEN** decision SHALL NOT be retry

#### Scenario: Provider failures are bounded
- **WHEN** provider failures reach maxProviderFailures
- **THEN** orchestration SHALL stop or safely degrade

### Requirement: Stop Conditions
The system SHALL stop ReAct orchestration under configured safety conditions.

#### Scenario: High risk can stop run
- **WHEN** policy stopOnHighRisk is true and quality risk is high
- **THEN** orchestration SHALL stop or safely degrade

#### Scenario: Schema failure after retry stops run
- **WHEN** policy stopOnSchemaValidationFailureAfterRetry is true and schema validation still fails after retry
- **THEN** orchestration SHALL stop or safely degrade

#### Scenario: Inactive session stops run
- **WHEN** practice session status is abandoned or failed
- **THEN** orchestration SHALL stop and SHALL NOT add user-visible output

### Requirement: Badcase Trigger Points
The system SHALL define badcase trigger points from ReAct orchestration.

#### Scenario: Provider schema failure can trigger badcase
- **WHEN** provider output fails schema validation and retry does not recover
- **THEN** orchestration SHALL be able to emit a provider_schema_failure badcase signal

#### Scenario: High risk output can trigger badcase
- **WHEN** quality gate reports high hallucination risk or high-risk correction
- **THEN** orchestration SHALL be able to emit a badcase signal with session, scenario, skill, and optional turn attribution

#### Scenario: Max steps can trigger badcase
- **WHEN** max steps are reached without safe final output
- **THEN** orchestration SHALL be able to emit a badcase signal

### Requirement: No Model Execution In This Change
The system SHALL NOT execute models from ReAct orchestration in this change.

#### Scenario: Orchestration schema does not call providers
- **WHEN** ReAct run, step, policy, or decision helpers are used
- **THEN** they SHALL NOT call Qwen, OpenAI, mock provider, or any other model provider

#### Scenario: Orchestration does not build prompts directly
- **WHEN** ReAct orchestration is defined
- **THEN** it SHALL NOT duplicate Prompt Context Builder behavior
