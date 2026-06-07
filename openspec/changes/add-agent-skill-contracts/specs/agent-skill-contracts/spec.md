## ADDED Requirements

### Requirement: Agent Skill Documents
The system SHALL define four English speaking coach Agent Skill documents under `agent-skills/`: practice, assessment, correction, and summary.

#### Scenario: Skill documents are present
- **WHEN** the project initializes the English speaking coach planning artifacts
- **THEN** `agent-skills/english-practice/SKILL.md`, `agent-skills/english-assessment/SKILL.md`, `agent-skills/english-correction/SKILL.md`, and `agent-skills/english-summary/SKILL.md` SHALL exist

#### Scenario: Skill documents use a common structure
- **WHEN** an Agent Skill document is reviewed
- **THEN** it SHALL include purpose, usage conditions, inputs, required process, output contract, quality gates, prohibited behavior, failure handling, and examples

### Requirement: Practice Agent Workflow Contract
The system SHALL define a practice Agent Skill that governs realtime speaking practice flow without relying on scenario prompt text alone.

#### Scenario: Practice skill controls turn flow
- **WHEN** the practice Agent receives scenario context and recent transcript turns
- **THEN** it SHALL guide the next AI move according to a role-play conversation flow, one-question-at-a-time policy, target learning goals, and short spoken response constraints

#### Scenario: Practice skill avoids over-teaching
- **WHEN** the user is actively practicing conversation
- **THEN** the practice Agent SHALL keep replies suitable for voice playback and SHALL NOT produce long grammar lectures or take over the user's speaking task

### Requirement: Assessment Agent Workflow Contract
The system SHALL define an assessment Agent Skill that evaluates learner performance and AI response quality using structured, non-official scoring.

#### Scenario: Assessment dimensions are produced
- **WHEN** the assessment Agent evaluates a turn or session
- **THEN** it SHALL produce structured scores for fluency, pronunciation clarity, grammar, vocabulary, coherence, scenario relevance, and role alignment

#### Scenario: Hallucination and confidence are reported
- **WHEN** the assessment Agent evaluates AI feedback or AI role-play behavior
- **THEN** it SHALL report hallucination risk, confidence label, supporting evidence, and recommended action without exposing chain-of-thought

### Requirement: Correction Agent Workflow Contract
The system SHALL define a correction Agent Skill that supports realtime lightweight correction and full post-session correction.

#### Scenario: Realtime correction is restrained
- **WHEN** a user finishes a speaking turn and a correction candidate is available
- **THEN** the correction Agent SHALL allow at most one high-confidence, useful, non-interrupting correction for after-turn display

#### Scenario: Low-confidence correction is suppressed
- **WHEN** a correction candidate has low confidence or insufficient evidence
- **THEN** the correction Agent SHALL suppress realtime display and SHALL either discard it or mark it for summary review

#### Scenario: Correction output is explainable
- **WHEN** the correction Agent emits a correction item
- **THEN** it SHALL include the original text, corrected text, correction type, severity, confidence label, display timing, and a concise learner-facing explanation

### Requirement: Summary Agent Workflow Contract
The system SHALL define a summary Agent Skill that produces a structured post-session learning report.

#### Scenario: Summary includes learning report sections
- **WHEN** a practice session ends with transcript, assessment, and correction data
- **THEN** the summary Agent SHALL produce overall score, dimension scores, strengths, priority issues, corrected sentences, recommended expressions, and next practice suggestions

#### Scenario: Summary avoids unsupported claims
- **WHEN** the summary Agent estimates learner performance
- **THEN** it SHALL NOT present scores as official IELTS, TOEFL, CEFR, or pronunciation certification results

### Requirement: Structured Output Contracts
The system SHALL define runtime-verifiable data contracts for outputs produced by the Agent Skills.

#### Scenario: Output schemas are available
- **WHEN** implementation code needs to validate Agent outputs
- **THEN** it SHALL be able to import schemas and TypeScript types for practice guidance, assessment result, quality assessment, correction item, and practice summary

#### Scenario: Scores use a consistent scale
- **WHEN** Agent Skill outputs include numeric quality or learning scores
- **THEN** those scores SHALL use a 0 to 100 internal scale and SHALL include confidence or risk labels where relevant

### Requirement: Skill And Scenario Separation
The system SHALL keep Agent Skills responsible for workflow and keep scenarios responsible for practice context.

#### Scenario: Scenario supplies context
- **WHEN** a prompt builder is introduced in a later change
- **THEN** it SHALL combine scenario context, Agent Skill instructions, and runtime state rather than using a single scenario instruction string as the full behavior controller

#### Scenario: Skills are not stored as Codex development skills
- **WHEN** Agent Skill documents are added to the project
- **THEN** they SHALL be stored under `agent-skills/` and SHALL NOT be placed under `.codex/skills/`
