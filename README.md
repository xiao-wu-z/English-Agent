<h1 align="center">English Agent</h1>

<p align="center">
  A scenario-based AI English speaking coach with realtime voice conversation,
  lightweight corrections, and structured practice reports.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Qwen-Realtime-624AFF?style=flat-square" alt="Qwen Realtime">
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/Language-中文-red?style=flat-square" alt="中文"></a>
</p>

English Agent is an MVP for practicing spoken English in realistic situations. It combines a reusable scenario catalog, text and voice practice modes, a realtime model connection, transcript handling, restrained turn-level corrections, and an end-of-session report.

The project is designed around one principle: **keep the conversation moving, then turn the conversation into actionable feedback**. Corrections are shown only when they are useful and sufficiently confident; lower-priority issues can be deferred to the final report instead of interrupting every turn.

## What It Provides

| Capability | Description |
| --- | --- |
| Scenario-based practice | Choose from daily small talk, restaurant ordering, job interviews, airport travel, and business meetings. |
| Text and voice modes | Validate a scenario through text first, or start a realtime microphone conversation. |
| Realtime voice loop | Captures browser microphone audio, streams PCM audio to the server, receives model events through SSE, and schedules returned PCM audio for playback. |
| Stable transcript rendering | Merges partial and final transcript events instead of displaying every provider delta as a separate message. |
| Lightweight corrections | Evaluates finalized learner turns and surfaces concise, high-confidence corrections without taking over the conversation. |
| Structured practice report | Produces an overall score, dimension scores, strengths, priority issues, corrected sentences, recommended expressions, and next-practice suggestions. |
| Scenario-aware agent skills | Uses separate practice, correction, assessment, and summary skill contracts while keeping provider details outside the UI. |
| Recovery and diagnostics | Includes heartbeat, timeout, lifecycle, playback-queue, and safe user-facing error handling for realtime sessions. |
| Provider abstraction | Runs locally with a deterministic mock provider or connects to Qwen Realtime through a server-side WebSocket adapter. |

## Current Scenarios

| Scenario | Difficulty | Practice focus |
| --- | --- | --- |
| Daily Small Talk | Beginner | Greetings, natural follow-up questions, and everyday conversation |
| Restaurant Ordering | Beginner | Ordering food, asking about menu items, and polite requests |
| Job Interview | Intermediate | Introductions, experience, strengths, and role-related answers |
| Airport Travel | Intermediate | Asking for information and handling common airport situations |
| Business Meeting | Advanced | Updates, questions, clarification, and professional responses |

Scenario definitions live in [`src/scenarios`](src/scenarios). Each scenario supplies its setting, roles, goals, milestones, suggested expressions, and skill bindings through a validated JSON schema.

## How a Voice Session Works

```text
Browser microphone
  -> PCM16 mono, 16 kHz capture
  -> POST audio chunks to the Next.js server
  -> Qwen Realtime WebSocket
  -> provider transcript and audio events
  -> server-side normalized application events
  -> SSE stream to the browser
  -> merged transcript + scheduled PCM playback
  -> correction.ready for selected finalized turns
  -> structured report when the session ends
```

The browser never receives the model-provider API key. Provider authorization, prompt composition, transcript persistence, correction decisions, and report generation remain server-side.

## Quick Start

### Requirements

- Node.js 20 or newer
- npm
- A modern Chromium-based browser for microphone practice
- A DashScope/Qwen API key only when using the Qwen provider

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The default provider is `mock`, so the application can be explored without an external API key.

## Model Configuration

Create a local `.env.local` file. Environment files are excluded by `.gitignore`.

### Local mock provider

```bash
MODEL_PROVIDER=mock
```

Use this mode for UI development, contract tests, and deterministic local flows.

### Qwen realtime provider

```bash
MODEL_PROVIDER=qwen
DASHSCOPE_API_KEY=your_dashscope_api_key

# Optional overrides
QWEN_REALTIME_MODEL=qwen3.5-omni-plus-realtime
# QWEN_REALTIME_URL=wss://your-compatible-realtime-endpoint
```

`QWEN_API_KEY` is also accepted as an alternative to `DASHSCOPE_API_KEY`. Keep all provider credentials on the server and never expose them through `NEXT_PUBLIC_*` variables.

## Using the Application

1. Select a practice scenario.
2. Choose **Text** or **Voice** mode.
3. Start the practice session.
4. In voice mode, grant microphone permission and speak naturally.
5. Review the merged learner and coach transcript while listening to scheduled model audio.
6. Use lightweight corrections as immediate guidance when they appear.
7. End the session to generate the structured report.

The diagnostics panel is intended for development and troubleshooting. It exposes safe connection, lifecycle, event, and playback states, but must not contain raw audio, credentials, provider authorization data, or hidden model reasoning.

## Practice Report

The report contract includes:

- Overall score
- Fluency, pronunciation clarity, grammar, vocabulary, expression, and coherence scores
- Strengths and priority issues
- Corrected learner sentences with explanations
- Recommended expressions
- Suggestions for the next practice session

Report generation waits for pending finalized transcripts before summarization, reducing the chance that the learner's last turn is omitted.

## Architecture

```text
src/
├── app/
│   ├── api/practice-sessions/          # Text-session HTTP routes
│   ├── api/realtime-practice-sessions/ # Voice create/audio/SSE/end routes
│   └── page.tsx                        # MVP application shell
├── components/voice-practice/          # Scenario, transcript, correction,
│                                       # controls, diagnostics, and report UI
├── lib/
│   ├── agent-skills/                   # Practice/correction/assessment/summary runtime
│   ├── agent-skill-contracts/          # Structured model output schemas
│   ├── model-providers/                # Mock and Qwen provider adapters
│   ├── pcm-audio-capture/              # Browser PCM16 microphone capture
│   ├── qwen-pcm-playback/              # Ordered output-audio scheduling
│   ├── realtime-voice-flow/            # Server-side voice orchestration
│   ├── realtime-voice-recovery/        # Timeout and recovery policy
│   ├── realtime-voice-ui/              # Transcript/correction UI decisions
│   ├── text-practice-flow/             # Text-session orchestration
│   ├── voice-skill-flow/               # Final-turn correction and report workflow
│   └── voice-practice-client/          # Browser-facing contracts and helpers
└── scenarios/                          # Validated practice scenario definitions
```

### Design boundaries

- **The UI owns interaction state:** selected scenario, active mode, microphone state, transcript presentation, correction cards, and report rendering.
- **The application flow owns lifecycle:** session creation, audio ingestion, SSE delivery, finalized-turn processing, and session shutdown.
- **Agent skills own learning behavior:** practice prompts, lightweight correction, assessment, and summary generation.
- **Providers own transport details:** mock behavior or Qwen WebSocket protocol translation.
- **Zod contracts protect boundaries:** API payloads, provider events, application events, corrections, and reports are parsed before use.

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/practice-sessions` | Create a text practice session |
| `GET` | `/api/practice-sessions/:sessionId` | Read text-session state |
| `POST` | `/api/practice-sessions/:sessionId/turns` | Submit a learner text turn |
| `POST` | `/api/practice-sessions/:sessionId/end` | End text practice and generate a report |
| `POST` | `/api/realtime-practice-sessions` | Create a realtime voice session |
| `POST` | `/api/realtime-practice-sessions/:sessionId/audio` | Upload a PCM audio chunk |
| `GET` | `/api/realtime-practice-sessions/:sessionId/events` | Subscribe to normalized SSE events |
| `POST` | `/api/realtime-practice-sessions/:sessionId/end` | End voice practice and generate a report |

The realtime SSE stream can include lifecycle events, transcript deltas, finalized transcripts, output-audio chunks, `correction.ready`, safe workflow errors, and `session.closed`.

## Data and Privacy

- Raw microphone audio is forwarded for realtime processing and is not intentionally stored by the application.
- API keys remain in server-side environment variables.
- Corrections, reports, diagnostics, and user-visible errors must not include raw/base64 audio, authorization headers, or hidden reasoning.
- The repository includes local-history contracts and storage utilities, but durable multi-device accounts and database-backed synchronization are outside the current MVP.
- Production deployments should add authentication, rate limiting, retention rules, abuse controls, observability, and an explicit privacy policy.

## Development

```bash
npm run dev      # Start the development server
npm run test     # Run Node test suites
npm run lint     # Run ESLint
npm run build    # Create a production build
npm run start    # Start the production server
```

Tests are colocated with their modules as `*.test.ts`. They cover schemas, provider adapters, scenario validation, transcript merging, realtime orchestration, correction behavior, recovery policy, audio contracts, and report generation.

## Project Documentation

| Document | Purpose |
| --- | --- |
| [Product and architecture design](docs/superpowers/specs/2026-06-06-ai-english-speaking-coach-design.md) | Original product scope, learning loop, and system design |
| [中文产品与架构设计](docs/superpowers/specs/2026-06-06-ai-english-speaking-coach-design.zh.md) | Chinese version of the original design |
| [Voice integration and UI design](docs/superpowers/specs/2026-06-07-voice-practice-integration-ui-design.md) | Current realtime voice, correction, reporting, and UI integration decisions |
| [Voice integration implementation plan](docs/superpowers/plans/2026-06-07-voice-practice-integration-ui.md) | Implementation tasks and verification steps |

## MVP Status and Roadmap

Implemented in the current MVP:

- Five validated practice scenarios
- Text and realtime voice practice
- Mock and Qwen model-provider adapters
- Server-side SSE event normalization
- Ordered PCM playback and transcript merging
- Lightweight turn-level correction
- Structured end-of-session reports
- Realtime recovery and diagnostic states

Important follow-up work:

- Production authentication and user profiles
- Durable practice history backed by a database
- Cross-device progress tracking and analytics
- More scenarios and configurable difficulty
- Pronunciation-specific scoring
- Broader browser and mobile-device validation
- Production monitoring, quotas, and privacy controls

## Contributing

Before changing behavior, read the relevant design and implementation documents under [`docs/superpowers`](docs/superpowers). Keep provider-specific details behind the provider interfaces, validate new structured data with Zod, and add focused tests beside the affected module.

This repository currently does not include a license file. Do not assume redistribution or commercial-use permissions until a license is explicitly added.
