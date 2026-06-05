# AI English Speaking Coach Project Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the initial Next.js + TypeScript project and introduce the baseline scenario-driven structure from the design spec.

**Architecture:** The app starts as a client-heavy Next.js MVP with a validated scenario catalog, a practice room shell, and local history foundation. OpenAI Realtime integration is isolated behind API routes and client session utilities so later work can replace mocks with live WebRTC behavior without rewriting the UI.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Zod, React, browser localStorage.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `next.config.ts`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `postcss.config.mjs`: Tailwind PostCSS integration.
- `eslint.config.mjs`: lint configuration generated for Next.js.
- `src/app/layout.tsx`: root HTML shell and metadata.
- `src/app/page.tsx`: main single-screen MVP app.
- `src/app/globals.css`: global styles and Tailwind imports.
- `src/lib/scenarios/schema.ts`: Zod schema and exported TypeScript types.
- `src/lib/scenarios/index.ts`: validated scenario catalog exports.
- `src/lib/history.ts`: localStorage helpers for practice summaries.
- `src/scenarios/*.json`: five built-in practice scenario configs.
- `docs/superpowers/specs/*.md`: human and agent-readable baseline design specs.

## Task 1: Commit Baseline Specs And Plan

**Files:**
- Add: `docs/superpowers/specs/2026-06-06-ai-english-speaking-coach-design.md`
- Add: `docs/superpowers/specs/2026-06-06-ai-english-speaking-coach-design.zh.md`
- Add: `docs/superpowers/plans/2026-06-06-ai-english-speaking-coach-project-bootstrap.md`

- [ ] **Step 1: Stage docs**

Run:

```bash
git add docs/superpowers/specs/2026-06-06-ai-english-speaking-coach-design.md docs/superpowers/specs/2026-06-06-ai-english-speaking-coach-design.zh.md docs/superpowers/plans/2026-06-06-ai-english-speaking-coach-project-bootstrap.md
```

Expected: no output.

- [ ] **Step 2: Commit docs**

Run:

```bash
git commit -m "docs: add AI English coach baseline specs"
```

Expected: commit is created.

## Task 2: Scaffold Next.js App

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create project**

Run:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Next.js app files are created in the repository root.

- [ ] **Step 2: Verify scaffold**

Run:

```bash
npm run lint
```

Expected: lint completes without errors.

- [ ] **Step 3: Commit scaffold**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs src
git commit -m "chore: scaffold Next.js app"
```

Expected: commit is created.

## Task 3: Add Scenario Schema And Configs

**Files:**
- Create: `src/lib/scenarios/schema.ts`
- Create: `src/lib/scenarios/index.ts`
- Create: `src/scenarios/job-interview.json`
- Create: `src/scenarios/restaurant.json`
- Create: `src/scenarios/business-meeting.json`
- Create: `src/scenarios/travel.json`
- Create: `src/scenarios/small-talk.json`

- [ ] **Step 1: Install Zod**

Run:

```bash
npm install zod
```

Expected: `zod` is added to `package.json`.

- [ ] **Step 2: Add schema**

Create `src/lib/scenarios/schema.ts`:

```ts
import { z } from "zod";

export const correctionFocusSchema = z.enum([
  "grammar",
  "pronunciation_clarity",
  "expression",
  "professional_expression",
  "vocabulary",
]);

export const scenarioSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  aiRole: z.string().min(1),
  userRole: z.string().min(1),
  openingMessage: z.string().min(1),
  goals: z.array(z.string().min(1)).min(1),
  realtimeInstructions: z.string().min(1),
  correctionPolicy: z.object({
    interruptLevel: z.enum(["low", "medium"]),
    focus: z.array(correctionFocusSchema).min(1),
  }),
  summaryRubric: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .min(1),
});

export type PracticeScenario = z.infer<typeof scenarioSchema>;
```

- [ ] **Step 3: Add catalog loader**

Create `src/lib/scenarios/index.ts`:

```ts
import businessMeeting from "@/scenarios/business-meeting.json";
import jobInterview from "@/scenarios/job-interview.json";
import restaurant from "@/scenarios/restaurant.json";
import smallTalk from "@/scenarios/small-talk.json";
import travel from "@/scenarios/travel.json";
import { PracticeScenario, scenarioSchema } from "./schema";

const rawScenarios = [
  jobInterview,
  restaurant,
  businessMeeting,
  travel,
  smallTalk,
];

export const scenarios: PracticeScenario[] = rawScenarios.map((scenario) =>
  scenarioSchema.parse(scenario),
);

export function getScenarioById(id: string): PracticeScenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}
```

- [ ] **Step 4: Add five scenario JSON files**

Create the five JSON files with the schema fields from the baseline spec. Each file must include realistic role instructions, goals, correction policy, and four rubric items: fluency, pronunciation, grammar, expression.

- [ ] **Step 5: Commit scenarios**

Run:

```bash
git add src/lib/scenarios src/scenarios package.json package-lock.json
git commit -m "feat: add configurable scenario catalog"
```

Expected: commit is created.

## Task 4: Add MVP UI Shell

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Create: `src/lib/history.ts`

- [ ] **Step 1: Add history helper**

Create `src/lib/history.ts` with bounded localStorage helpers for the latest 20 summaries.

- [ ] **Step 2: Replace starter page**

Modify `src/app/page.tsx` to render:

- scenario cards
- selected scenario details
- voice session placeholder controls
- transcript placeholder
- correction placeholder
- local history placeholder

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: lint completes without errors.

- [ ] **Step 4: Commit UI shell**

Run:

```bash
git add src/app src/lib/history.ts
git commit -m "feat: add English practice MVP shell"
```

Expected: commit is created.

## Task 5: Verify Local App

**Files:**
- No source edits expected unless verification finds issues.

- [ ] **Step 1: Run build**

Run:

```bash
npm run build
```

Expected: production build succeeds.

- [ ] **Step 2: Start dev server**

Run:

```bash
npm run dev
```

Expected: local app starts and prints a localhost URL.

- [ ] **Step 3: Manual browser check**

Open the local URL and confirm:

- at least five scenarios are visible
- selecting a scenario updates the practice room
- history area renders
- layout is usable on desktop viewport

