# Deep Agents UI — CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this is

A standalone web UI for interacting with [Deep Agents](https://github.com/langchain-ai/deepagents) —
LangChain's open-source agent harness (planning, filesystem/shell access, sub-agent
delegation). This app is a **thin, client-side chat frontend** that connects to a
running **LangGraph deployment** (local `langgraph dev` or a deployed graph) and
streams the agent's execution: messages, tool calls, sub-agents, a todo/plan list,
and a virtual filesystem — all read from LangGraph run state.

There is **no backend of our own**. Everything talks directly to the LangGraph
server via `@langchain/langgraph-sdk` from the browser. Configuration (deployment
URL, assistant ID, optional LangSmith API key) is entered in a dialog and persisted
to `localStorage` — no server-side secrets, no database.

## Tech stack

- **Next.js 16** (App Router, `--turbopack` in dev), **React 19**, **TypeScript** (strict)
- **Tailwind CSS 3** + **shadcn/ui** (Radix primitives) for components
- **@langchain/langgraph-sdk** — the `Client` and the `useStream` React hook do all the work
- **nuqs** — URL query-state (`threadId`, `assistantId`, `sidebar`) as the router-level source of truth
- **SWR** (`useSWRInfinite`) — paginated thread-list fetching
- **sonner** — toasts; **lucide-react** — icons; **react-markdown** + **remark-gfm** — message rendering
- Package manager: **yarn 1.22** (classic). Node **20** (`.nvmrc`).

## Commands

```bash
yarn install          # install deps
yarn dev              # next dev --turbopack  → http://localhost:3000
yarn build            # production build (must pass in CI)
yarn start            # serve production build
yarn lint             # eslint .
yarn lint:fix         # eslint . --fix
yarn format           # prettier --write .
yarn format:check     # prettier --check .  (CI gate)
```

There is **no test suite** in this repo. CI runs `format:check`, `lint`, `build`,
and codespell (on `README.md` and `src/`). All three of format/lint/build must pass —
run them before pushing.

## Connecting to an agent

The UI needs a LangGraph deployment to talk to. Locally:

```bash
# in a deepagents quickstart, e.g. deep_research
langgraph dev          # serves http://127.0.0.1:2024
```

Then open the UI, and in **Settings** provide:
- **Deployment URL** — e.g. `http://127.0.0.1:2024`
- **Assistant ID** — either a graph name (e.g. `research`, from `langgraph.json`) or an assistant UUID
- **LangSmith API Key** (optional) — `lsv2_pt_...`, needed for deployed graphs. Can also come
  from `NEXT_PUBLIC_LANGSMITH_API_KEY`. **UI settings take precedence over the env var.**

Assistant-ID resolution (`src/app/page.tsx` → `fetchAssistant`): if the ID looks like a
UUID it's fetched directly (`client.assistants.get`); otherwise it's treated as a graph name
and the app searches assistants for that graph and picks the one with
`metadata.created_by === "system"`. Both paths fall back to a synthetic `Assistant` object
on failure so the chat still renders. The same UUID-vs-graph-name distinction drives thread
filtering in `useThreads` (UUID → filter by `assistant_id` metadata; graph name → no filter,
because local dev graphs don't set that metadata).

## Architecture & data flow

```
page.tsx (HomePage)
 └─ ClientProvider           creates the LangGraph Client (apiUrl + X-Api-Key header)
     └─ HomePageInner
         ├─ ThreadList        useThreads (SWR) — sidebar of past threads, status-filterable
         └─ ChatProvider      wraps useChat → exposes ChatContext
             └─ ChatInterface  renders messages, todos, files; the input box
                 └─ ChatMessage → ToolCallBox / SubAgentIndicator / ToolApprovalInterrupt
```

**Everything flows through `useChat` (`src/app/hooks/useChat.ts`).** It wraps the SDK's
`useStream<StateType>` and is the single source of runtime truth. The graph's state shape
this UI expects:

```ts
type StateType = {
  messages: Message[];
  todos: TodoItem[];                 // the plan / task list
  files: Record<string, string>;     // virtual filesystem: path → content
  email?: { id?; subject?; page_content? };  // optional, domain-specific
  ui?: any;                          // LangGraph generative-UI payloads
};
```

`useChat` exposes actions that all funnel into `stream.submit(...)`:

| Action | What it does |
|---|---|
| `sendMessage(content)` | append a human message and run (optimistic update, `recursion_limit: 100`) |
| `runSingleStep(msgs, checkpoint?, isRerunningSubagent?, ...)` | step-debugging: submit with `interruptBefore`/`interruptAfter: ["tools"]` and/or a checkpoint |
| `continueStream(hasTaskToolCall?)` | resume a paused run |
| `resumeInterrupt(value)` | answer a human-in-the-loop interrupt via `command: { resume }` |
| `markCurrentThreadAsResolved()` | force the graph to `__end__` |
| `setFiles(files)` | write the virtual FS back via `client.threads.updateState` |
| `stopStream()` | abort the active run |

`threadId` lives in the URL (nuqs). `useStream` is configured with `reconnectOnMount`,
`fetchStateHistory: true` (so switching to an existing thread rehydrates state), and
`onFinish`/`onError`/`onCreated` → `onHistoryRevalidate` to keep the thread list fresh.

### Message processing

`ChatInterface` contains the important reducer (`processedMessages`, a `useMemo`): it walks
the flat `messages` array and builds a map of `{ message, toolCalls }`, matching `tool`
result messages back to their originating AI tool-call by `tool_call_id`. Tool calls can
arrive in three shapes (`additional_kwargs.tool_calls`, `message.tool_calls`, or `tool_use`
content blocks) — all three are handled. A `task` tool call with a `subagent_type` arg is
rendered as a **SubAgent** (see `ChatMessage`), not a plain tool box.

### Human-in-the-loop interrupts

When the graph interrupts with `action_requests` / `review_configs`, `ChatInterface` builds
maps keyed by action name and passes them to the **last** message. `ToolApprovalInterrupt`
renders approve / reject (with message) / edit-args controls and calls `resumeInterrupt` with
`{ decisions: [{ type, ... }] }`. Allowed decisions come from the graph's `reviewConfig`,
defaulting to `["approve", "reject", "edit"]`.

## Directory layout

```
src/
├── app/
│   ├── page.tsx              entry: config gate, ClientProvider, layout shell, assistant resolution
│   ├── layout.tsx            RootLayout: NuqsAdapter + Toaster + Inter font
│   ├── globals.css           CSS variables (light/dark design tokens)
│   ├── components/           feature components (chat, threads, dialogs, tool/sub-agent UI)
│   ├── hooks/
│   │   ├── useChat.ts        ★ the core: wraps useStream, all run actions
│   │   └── useThreads.ts     SWR infinite thread-list loader
│   ├── types/types.ts        ToolCall, SubAgent, TodoItem, Thread, interrupt shapes
│   └── utils/utils.ts        message content extraction & LLM formatting helpers
├── components/ui/            shadcn/ui primitives (button, dialog, select, tabs, ...)
├── lib/
│   ├── config.ts             StandaloneConfig + localStorage get/save (key: "deep-agent-config")
│   └── utils.ts              cn() classname helper
└── providers/
    ├── ClientProvider.tsx    LangGraph Client via React context (useClient)
    └── ChatProvider.tsx      useChat via React context (useChatContext)
```

Note there are **two** `utils.ts` (`src/lib/utils.ts` and `src/app/utils/utils.ts`) both
exporting `cn`; the app-level one additionally has the message helpers. Import `cn` from
`@/lib/utils` in `components/ui/*` (shadcn convention) and from wherever is local elsewhere.

## Conventions

- **Path alias:** `@/*` → `src/*` (tsconfig). Use it; avoid deep relative imports.
- **Client components:** anything using hooks/state needs `"use client"` at the top (App Router).
- **State ownership:**
  - Router/shareable state (which thread, sidebar open, assistant) → **nuqs** query state.
  - Live run state (messages, todos, files, interrupts) → **`useChat`/`useStream`**, never duplicated in local state.
  - App config → **localStorage** via `lib/config.ts`.
- **shadcn/ui:** add primitives under `src/components/ui/` following existing files; `components.json`
  is configured (style `default`, base color `slate`, RSC on).
- **Styling:** Tailwind + semantic tokens backed by CSS variables in `globals.css`
  (`bg-background`, `text-muted-foreground`, `border-border`, plus custom `text-success`,
  `text-warning`, `bg-sidebar`, `bg-destructive`, `text-tertiary`, etc. — defined in
  `tailwind.config.mjs`). Prefer these tokens over hardcoded colors so light/dark both work.
  A few brand colors are still hardcoded (e.g. the teal `#2F6868` "New Thread" button).
- **`any` is allowed** — `@typescript-eslint/no-explicit-any` is off. LangGraph state and UI
  payloads are loosely typed at the boundary; narrow where practical but don't fight the SDK.
- **Unused vars:** error, but `_`-prefixed and function args are ignored.
- **Prettier:** `singleAttributePerLine: true` and the tailwind class-sorter plugin are on —
  run `yarn format` before committing or CI's `format:check` fails.

## PR conventions

- CI (`.github/workflows/ci.yml`): format check, lint, build, codespell must be green.
- **PR titles must be semantic** (`pr_lint.yml`): `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|release`,
  optional scope from `shared|cli|web|open-swe|docs`. Example: `feat(web): add thread search`.

## Gotchas

- **No server proxy.** The browser calls the LangGraph deployment directly, so that server
  must allow the UI's origin (CORS) and be reachable from the browser (not just from Node).
- **API key header.** `ClientProvider` sends the key as `X-Api-Key`; `useChat` also sets
  `x-auth-scheme: langsmith`. Deployed graphs typically need the LangSmith key; local dev usually doesn't.
- **Optimistic messages** are applied on send; the real state replaces them when the stream
  responds. If the graph state shape diverges from `StateType`, todos/files silently render empty
  rather than erroring — check the actual run state in LangGraph Studio when debugging "missing" data.
- **`fetchStateHistory` + `reconnectOnMount`** mean switching threads or refreshing rehydrates
  from the server; don't add local caches that could drift from it.
- Environment: this repo is one of two in the workspace (`deep-agents-ui`, `elm_agent`); they are
  unrelated. `elm_agent` is a Python/CrewAI backend with its own `CLAUDE.md`.
```
