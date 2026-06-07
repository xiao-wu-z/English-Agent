## ADDED Requirements

### Requirement: Text Model Provider Abstraction
The system SHALL define a provider-neutral text model interface for executing structured Agent Skill requests.

#### Scenario: Provider executes SkillRunRequest
- **WHEN** a text model provider receives a `SkillRunRequest`
- **THEN** it SHALL use the request messages and expected output schema to produce a typed structured result

#### Scenario: Provider does not depend on scenario or skill internals
- **WHEN** a provider executes a request
- **THEN** it SHALL NOT read raw scenario files, Agent Skill markdown files, or prompt builder internals

### Requirement: Multi-Provider Registry
The system SHALL provide a registry that can resolve text providers by explicit configuration.

#### Scenario: Mock provider is default
- **WHEN** no provider is configured
- **THEN** the registry SHALL resolve the mock text provider

#### Scenario: Qwen provider is explicit
- **WHEN** `MODEL_PROVIDER=qwen` is configured
- **THEN** the registry SHALL resolve the Qwen text provider

#### Scenario: Unknown provider fails clearly
- **WHEN** an unsupported provider name is configured
- **THEN** the registry SHALL throw a clear provider configuration error

### Requirement: OpenAI-Compatible Text Provider
The system SHALL provide a reusable OpenAI-compatible text provider implementation.

#### Scenario: Compatible provider posts chat completions
- **WHEN** an OpenAI-compatible provider executes a text request
- **THEN** it SHALL call `{baseUrl}/chat/completions` with messages, model, JSON response format, temperature, and max token settings

#### Scenario: Compatible provider avoids local proxy side effects
- **WHEN** the provider makes HTTP requests
- **THEN** it SHALL avoid inheriting local proxy environment behavior that can break local development

### Requirement: Qwen Text Provider
The system SHALL provide a Qwen text provider using Alibaba Cloud DashScope OpenAI-compatible mode.

#### Scenario: Qwen provider reads server-only config
- **WHEN** Qwen provider initializes
- **THEN** it SHALL read API key from `QWEN_API_KEY` or `DASHSCOPE_API_KEY`, base URL from `QWEN_BASE_URL`, and model from `QWEN_TEXT_MODEL`

#### Scenario: Missing Qwen key fails clearly
- **WHEN** Qwen provider is selected but no Qwen API key is configured
- **THEN** it SHALL fail with `missing_api_key`

### Requirement: Mock Text Provider
The system SHALL provide a mock text provider for local development and tests.

#### Scenario: Mock provider returns schema-valid fixtures
- **WHEN** mock provider executes a request
- **THEN** it SHALL return a fixture that validates against the request's expected output schema

#### Scenario: Mock provider supports all expected output schemas
- **WHEN** the request expects practice guidance, assessment result, quality assessment, correction item, or practice summary
- **THEN** mock provider SHALL provide a matching structured fixture

### Requirement: Structured JSON Output Validation
The system SHALL parse and validate model output before exposing it to application code.

#### Scenario: Valid JSON is parsed and typed
- **WHEN** a provider returns schema-valid JSON
- **THEN** the abstraction SHALL return raw text, parsed value, provider name, model name, and optional usage data

#### Scenario: Invalid JSON fails clearly
- **WHEN** a provider returns text that cannot be parsed as JSON
- **THEN** the abstraction SHALL fail with `invalid_json`

#### Scenario: Schema-invalid JSON fails clearly
- **WHEN** a provider returns JSON that does not match the expected output schema
- **THEN** the abstraction SHALL fail with `schema_validation_failed`

#### Scenario: Hidden reasoning fields are rejected
- **WHEN** provider output includes fields outside the strict expected output schema
- **THEN** validation SHALL reject the output

### Requirement: Provider Secret Safety
The system SHALL keep model provider secrets server-side.

#### Scenario: Provider modules are server-only
- **WHEN** provider code reads API keys or provider secrets
- **THEN** that code SHALL live in server-only modules and SHALL NOT be imported by client components

#### Scenario: Result does not expose secrets
- **WHEN** a provider returns a result or error
- **THEN** it SHALL NOT include API keys, Authorization headers, or secret environment variable values

### Requirement: Realtime Provider Placeholder
The system SHALL define realtime provider interfaces without implementing realtime transport in this change.

#### Scenario: Realtime interface exists
- **WHEN** later changes add Qwen Omni or other realtime providers
- **THEN** they SHALL have an interface boundary to implement

#### Scenario: Realtime execution is not available yet
- **WHEN** this change is complete
- **THEN** it SHALL NOT create Qwen Omni sessions, WebRTC sessions, WebSocket connections, or audio streams
