# Agent Instructions

<!-- Token budget: keep under 600 tokens. Keep in sync with .github/copilot-instructions.md and CLAUDE.md -->

## Output rules
- Code only. No explanations unless explicitly asked.
  Exception: always surface assumptions, ambiguities, and tradeoffs (briefly, as bullets).
- Bullets over paragraphs when text is needed.
- Multi-file changes: show diffs, not full files.
- No boilerplate comments in generated code.
- Chat with the user in Traditional Chinese (zh-TW).

## Coding behavior (Karpathy guidelines)
Think before coding:
- State assumptions explicitly; if multiple interpretations exist, present them — don't pick silently.
- If something is unclear, stop and ask. If a simpler approach exists, say so and push back.

Simplicity first:
- Minimum code that solves the ask. No speculative features, abstractions for single-use code, unrequested configurability, or error handling for impossible scenarios.
- If 200 lines could be 50, rewrite.

Surgical changes:
- Every changed line must trace to the request. Don't refactor, reformat, or "improve" adjacent code; match existing style.
- Remove imports/vars/functions that YOUR change orphaned; mention (never delete) pre-existing dead code.

Goal-driven execution:
- Turn tasks into verifiable goals with one verify check per step; state a brief plan for multi-step work.

## Workflow
- After a change is verified, auto commit + push to origin/main without asking. Never commit unverified/broken code.
- Verify by actually running: `npm run build` in the affected app; for `api/_*.js` logic/prompt changes, call the real API with `node` (don't force browser preview).
- After every code change, update the app's README + ARCHITECTURE.md (ARCHITECTURE matters most).

## Project
- npm workspaces monorepo: `apps/calorie-tracker` + `apps/recipe-book` + `apps/calendar` + `packages/shared`. React 19 + Vite; Supabase backend; deployed on Vercel. Read each app's ARCHITECTURE.md before structural changes.
- Adding a new app: follow `docs/new-app-sop.md` — the SOP for it (scope questions, directory layout, schema isolation, state-hub/styling conventions, LINE + nickname wiring, Vercel deploy, known pitfalls). Read it first; don't re-derive conventions from the existing apps.
- Each app has its own Supabase schema (`calorie_tracker` / `recipe_book` / `calendar`) + a `shared` schema; all share `auth.users`. Exposed-schema (PGRST106) fix: `ALTER ROLE authenticator SET pgrst.db_schemas` + `NOTIFY pgrst`.
- DB migrations: SQL files in `apps/*/supabase/` named `YYYY-MM-DD_desc.sql`, run manually in Supabase SQL Editor. `schema.sql` may be stale — check actual columns before changing payloads.
- LINE/LIFF is unified: logic in `packages/shared/src/lineAuth.js`; `api/_line*.js` files are verbatim-identical across the three apps — change one, sync all three.
- Secrets via env vars / `.env` (git-ignored). Never hardcode or commit credentials.
- Docs and code comments in Traditional Chinese, matching existing style.
