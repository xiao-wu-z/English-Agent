# Voice Practice Integration and UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect realtime voice sessions to the existing correction and summary Skill flow, then present scenario selection, live feedback, and a structured report in a focused single-page practice room.

**Architecture:** Extend the realtime orchestrator into a server-composed session that owns both realtime-provider and Skill-session IDs. Application events share the SSE stream with provider events. The client consumes one public session ID and renders scenario, correction, conversation, diagnostics, and report components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod, SSE/EventSource, Web Audio, Tailwind CSS, Node test runner.

---

### Task 1: Application Event Contracts

**Files:**
- Create: `src/lib/realtime-voice-flow/application-events.ts`
- Modify: `src/lib/realtime-voice-flow/sse.ts`
- Modify: `src/lib/realtime-voice-flow/sse.test.ts`

- [ ] **Step 1: Write failing tests for correction and workflow SSE events**

Add tests proving `correction.ready` carries a schema-valid `CorrectionItem`, `workflow.error` contains only safe code/message fields, and both format through the existing `realtime.event` SSE channel.

- [ ] **Step 2: Run the focused SSE tests**

Run: `node --test src/lib/realtime-voice-flow/sse.test.ts`

Expected: FAIL because application event schemas and union formatting do not exist.

- [ ] **Step 3: Implement typed application events**

Create a Zod discriminated union containing common `id`, `sessionId`, and `createdAt` fields. Extend the SSE formatter input type to accept provider or application events without changing the browser event name.

- [ ] **Step 4: Re-run focused tests**

Run: `node --test src/lib/realtime-voice-flow/sse.test.ts`

Expected: PASS.

### Task 2: Server-Composed Voice Session

**Files:**
- Modify: `src/lib/realtime-voice-flow/orchestrator.server.ts`
- Modify: `src/lib/realtime-voice-flow/orchestrator.test.ts`
- Modify: `src/lib/model-providers/server/qwen-realtime-websocket.ts`
- Modify: `src/lib/model-providers/server/qwen-realtime-websocket.test.ts`

- [ ] **Step 1: Write failing orchestration tests**

Add tests proving:

- session creation also creates a Skill session;
- selected scenario metadata is exposed;
- duplicate final transcript event IDs are processed once;
- `correction.ready` is emitted after a known correctable transcript;
- end waits for transcript processing and returns a structured summary;
- provider instructions contain the selected scenario role and setting.

- [ ] **Step 2: Run focused orchestration/provider tests**

Run:

```bash
node --test src/lib/realtime-voice-flow/orchestrator.test.ts src/lib/model-providers/server/qwen-realtime-websocket.test.ts
```

Expected: FAIL on missing composed-session behavior and scenario instructions.

- [ ] **Step 3: Implement composed session state**

Store `skillSessionId`, scenario metadata, processed final-event IDs, a transcript processing promise chain, application events, and optional summary on each realtime practice session.

When a provider emits `transcript.user.final`, append the provider event immediately, then enqueue `handleVoiceTranscript()`. Emit `correction.ready` only when the Skill result exposes a realtime correction. Emit safe `workflow.error` for correction failures.

- [ ] **Step 4: Implement composed end behavior**

Await transcript processing, close the provider, call `endVoiceSkillSession()`, store the summary, and return summary, scenario, session status, and history persistence status.

- [ ] **Step 5: Derive provider instructions from scenario context**

Extend `RealtimeSessionInput` with optional instructions and build those instructions from the validated scenario. Use them in Qwen `session.update` instead of the generic hard-coded instruction.

- [ ] **Step 6: Re-run focused tests**

Run the focused command from Step 2.

Expected: PASS.

### Task 3: Routes and Client Contracts

**Files:**
- Modify: `src/app/api/realtime-practice-sessions/route.ts`
- Modify: `src/app/api/realtime-practice-sessions/[sessionId]/end/route.ts`
- Modify: `src/app/api/realtime-practice-sessions/[sessionId]/events/route.ts`
- Create: `src/lib/voice-practice-client/types.ts`
- Create: `src/lib/voice-practice-client/index.ts`

- [ ] **Step 1: Write failing contract tests**

Add schema tests for create response, SSE event union, and end/report response. Validate scenario metadata, correction payload, summary dimensions, and safe error fields.

- [ ] **Step 2: Run focused contract tests**

Run: `node --test src/lib/voice-practice-client/*.test.ts`

Expected: FAIL because client schemas do not exist.

- [ ] **Step 3: Implement client-facing schemas**

Define schemas for scenario cards, create response, event union, summary/report response, and workflow errors. Export inferred types for the page and components.

- [ ] **Step 4: Update routes**

Return scenario metadata from create, the composed report from end, and all provider/application events through the existing event route.

- [ ] **Step 5: Re-run focused contract and route-adjacent tests**

Run:

```bash
node --test src/lib/voice-practice-client/*.test.ts src/lib/realtime-voice-flow/*.test.ts
```

Expected: PASS.

### Task 4: Practice Room Components

**Files:**
- Create: `src/components/voice-practice/scenario-picker.tsx`
- Create: `src/components/voice-practice/conversation-transcript.tsx`
- Create: `src/components/voice-practice/correction-panel.tsx`
- Create: `src/components/voice-practice/voice-controls.tsx`
- Create: `src/components/voice-practice/voice-diagnostics.tsx`
- Create: `src/components/voice-practice/practice-report.tsx`
- Create: `src/components/voice-practice/index.ts`
- Create: `src/lib/voice-practice-ui/view-model.ts`
- Create: `src/lib/voice-practice-ui/view-model.test.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing view-model tests**

Test scenario difficulty labels, state-aware primary actions, report dimension formatting, correction-card data, and session-lock behavior as pure functions.

- [ ] **Step 2: Run focused UI logic tests**

Run: `node --test src/lib/voice-practice-ui/view-model.test.ts`

Expected: FAIL because the view-model module does not exist.

- [ ] **Step 3: Implement the pure view model**

Create typed helpers for labels, action copy/disabled state, report score rows, and scenario-lock rules.

- [ ] **Step 4: Build focused presentational components**

Implement accessible scenario cards, transcript messages and live partials, correction card, controls, secondary diagnostics, and structured report. Components receive typed props and contain no network logic.

- [ ] **Step 5: Rewire the page**

Replace the hard-coded scenario list with catalog-derived client data. Consume `correction.ready`, handle `workflow.error`, call composed end, render ending progress, preserve transcript on report failure, and allow same-scenario restart or return to selection.

- [ ] **Step 6: Apply the visual system**

Use a warm neutral background, indigo/blue primary actions, restrained emerald success accents, larger spacing, clear cards, and responsive stacking. Keep diagnostic data visually secondary.

- [ ] **Step 7: Re-run focused UI tests**

Run: `node --test src/lib/voice-practice-ui/view-model.test.ts`

Expected: PASS.

### Task 5: Full Verification and Review

**Files:**
- Modify only if verification exposes defects.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: compilation, TypeScript checking, and static generation PASS.

- [ ] **Step 4: Browser smoke test**

Open the local page, select at least two scenarios, enter voice mode, verify the active practice layout, correction panel, ending state, and report rendering using mock-compatible interactions where real microphone/model access is unavailable.

- [ ] **Step 5: Review the final diff**

Verify no raw/base64 audio or secrets enter application events, report payloads, diagnostics, or history. Confirm `.claude/` and `.codex/` remain untracked and excluded.
