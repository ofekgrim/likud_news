# Article Review: Actionable Findings for Metzudat HaLikud

## Context
Review of "How To Be A World-Class Agentic Engineer" by @systematicls, mapped against the current project setup to identify concrete improvements for continuing development (Phases 4-7: Admin panel, Media pipeline, Push notifications, Testing, Deploy).

---

## Critical Finding #1: You Have Massive Context Bloat

**The article says:** "You want to give your agents only the exact amount of information they need to do their tasks and nothing more!"

**Your current problem:** Every session loads:
- `CLAUDE.md` — 213 lines (full project reference, tech stack, conventions, branding, screens list, commands, DB credentials, build status)
- `MEMORY.md` — 78 lines (project identity, stack, preferences, architecture, lessons)
- 34 agent files in `.claude/agents/` with a 727-line AGENTS_GUIDE.md and 148-line QUICK_START.md

When you ask "add a NestJS endpoint," the agent is also reading about TikTok strategy, Reddit community building, Whimsy Injector, and Israeli app store ratings. That's noise.

### Action Items:
1. **Slim down CLAUDE.md** — Make it a *routing directory* (the article's core advice), not an encyclopedia. Move detailed conventions into separate files that are only read when relevant:
   - `rules/flutter-rules.md` — Flutter conventions, Clean Architecture, BLoC patterns, naming
   - `rules/nestjs-rules.md` — NestJS conventions, module structure, API patterns
   - `rules/admin-rules.md` — Next.js admin conventions
   - Keep CLAUDE.md to ~50 lines: project name, monorepo layout, and IF-ELSE routing logic

2. **Kill or archive most of the 34 agents** — You realistically use 3-4 during development: frontend dev, backend architect, mobile app builder, maybe API tester. The marketing/design/operations agents are pure context noise. Archive them to `.claude/agents-archive/` so they're not discoverable.

3. **Slim down MEMORY.md** — Remove duplicated info (tech stack is already in CLAUDE.md). Keep only truly unique lessons and preferences.

---

## Critical Finding #2: CLAUDE.md Should Be IF-ELSE Routing, Not a Dump

**The article says:** "Treat your CLAUDE.md as a logical, nested directory of where to find context given a scenario."

**Your CLAUDE.md today** is a flat document that dumps everything. Here's what it should look like:

```markdown
# Metzudat HaLikud
Hebrew RTL news app. Monorepo: apps/mobile (Flutter), backend (NestJS), admin (Next.js).

## Before any task:
- Read the task description carefully
- If working on Flutter code → read `rules/flutter-rules.md`
- If working on NestJS code → read `rules/nestjs-rules.md`
- If working on admin panel → read `rules/admin-rules.md`
- If writing tests → read `rules/testing-rules.md`
- If task involves DB/migrations → read `rules/database-rules.md`

## After compaction:
- Re-read your task plan
- Re-read the files relevant to your current task

## Critical rules (always apply):
- RTL-first: EdgeInsetsDirectional, TextDirection.rtl
- Hebrew primary: l10n/he.json first, then en.json
- No direct API calls from UI: UseCase → Repository → DataSource
- Error handling: Either<Failure, T>, never throw
```

This way, a Flutter task only loads Flutter rules. A NestJS task only loads NestJS rules. No wasted context.

---

## Critical Finding #3: Your MEMORY.md Contradicts CLAUDE.md

**The article says:** "Performance will deteriorate as rules and skills start to contradict each other."

**Specific contradiction found:**
- `MEMORY.md` line 33: "BLoC states/events: sealed classes + Equatable (NOT @freezed)"
- `CLAUDE.md` line 60-61: "Events: `@freezed` union types... States: `@freezed` union types"

This is *exactly* what the article warns about. The agent doesn't know which instruction to follow. You need a "spa day" — consolidate and resolve contradictions.

### Action Items:
1. Decide: is it `@freezed` or `sealed classes + Equatable`? Check what you actually use in the codebase and make both files agree.
2. Audit all memory/rules for other contradictions.

---

## Critical Finding #4: Separate Research from Implementation

**The article says:** "Create a research task first, decide on implementation, then get another agent with fresh context to implement."

**How to apply for your remaining phases:**

For Phase 4 (Admin Panel) — DON'T say: "Build the admin panel"
Instead:
1. **Research session**: "Analyze the existing admin/ directory, list what's done, what's missing, and propose the implementation order"
2. **You decide** on the approach
3. **Implementation session (fresh context)**: "Implement the article list page with pagination using TanStack Query. Follow patterns from `admin/src/app/(authenticated)/articles/page.tsx`. Use shadcn/ui Table component."

The more specific your implementation prompt, the less the agent needs to figure out on its own, and the better the result.

---

## Critical Finding #5: Define Clear Task Endpoints (Contracts)

**The article says:** "Tests are a very good milestone... unless these X tests pass, your task is NOT complete."

**Your project has tests but no contract system.** For remaining phases, create task contracts:

```markdown
# CONTRACT: Admin Article List Page

## Must implement:
- Paginated table with 20 articles per page
- Search by title
- Filter by category, status (draft/published)
- Sort by date, views
- Delete (soft) with confirmation dialog

## Verification:
- [ ] `npm run test -- articles-list` passes all tests
- [ ] Page renders at http://localhost:3001/articles
- [ ] RTL text displays correctly
- [ ] Pagination works with 100+ articles in seed data

## NOT complete until all boxes checked.
```

This prevents the agent from implementing stubs and calling it done.

---

## Critical Finding #6: Use Neutral Prompts for Bug Hunting

**The article says:** Don't say "find me a bug" — the agent will manufacture one to please you.

**Instead say:** "Walk through the feed loading logic in `feed_bloc.dart` → `feed_service.ts` → `feed.controller.ts`. Trace the data flow and report your findings."

The adversarial agent pattern (bug-finder + disprover + referee) is worth using for your testing phase.

---

## Critical Finding #7: One Session Per Task, Not Marathon Sessions

**The article says:** "I've not found long-running 24-hour sessions to be optimal. A new session per contract."

**For your remaining phases**, don't try to build all of Phase 4 in one session. Break it into contracts, one session each:
- Session 1: Admin article CRUD
- Session 2: Admin category management
- Session 3: Admin media upload
- Session 4: Admin dashboard analytics
- etc.

Fresh context per task = better results than one massive session with compaction.

---

## Critical Finding #8: Stop Over-Engineering the Tooling

**The article says:** "If something truly is ground-breaking, the foundation companies will incorporate it."

**You have 34 custom agent files**, a 727-line agent guide, a quick start guide, and a complex multi-step workflow for agents. This is the exact over-engineering the article warns against. Claude Code already has built-in subagents (Explore, Plan, general-purpose). You don't need 34 custom personas — the built-in agent + good rules files will do 95% of what those agents do.

### Action Items:
- Archive the 34 agent files
- Delete AGENTS_GUIDE.md and QUICK_START.md
- Rely on good rules + specific prompts instead

---

## Summary: Concrete Action Plan

### Immediate (Do Now):
1. **Restructure CLAUDE.md** into a routing directory (~50 lines)
2. **Create rules files**: `rules/flutter-rules.md`, `rules/nestjs-rules.md`, `rules/admin-rules.md`, `rules/testing-rules.md`
3. **Fix the @freezed vs sealed classes contradiction** between CLAUDE.md and MEMORY.md
4. **Archive 34 agent files** to `.claude/agents-archive/`
5. **Clean up MEMORY.md** — remove duplicated info, keep only lessons learned

### Workflow Changes (Ongoing):
6. **Research before implementation** — always do a research session first, then implement with fresh context
7. **Write task contracts** before starting each piece of work
8. **One session per contract** — don't marathon
9. **Use neutral prompts** when investigating issues
10. **Regular "spa days"** — periodically review and consolidate your rules for contradictions

### What NOT to Do:
- Don't install new harnesses/plugins/packages for agent management
- Don't create more agent personas
- Don't keep adding to CLAUDE.md without cleaning up
- Don't run 24-hour sessions hoping for more output
