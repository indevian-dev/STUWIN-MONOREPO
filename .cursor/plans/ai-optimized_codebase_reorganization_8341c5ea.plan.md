---
name: AI-Optimized Codebase Reorganization
overview: Reorganize the stuwin-monorepo file and folder structure to reduce path depth, eliminate redundancy, introduce a client service layer, and add missing agent rules -- all aimed at maximizing AI coding productivity.
todos:
  - id: flatten-monorepo
    content: "Flatten monorepo: move stuwin-monorepo/frameworks/next to apps/web, stuwin-monorepo/frameworks/expo to apps/mobile, stuwin-monorepo/packages/shared to packages/shared. Update turbo.json, package.json, tsconfig paths."
    status: in_progress
  - id: client-service-layer
    content: Create lib/client-services/ with a BaseClientService class and domain-specific services (provider/, student/, public/, staff/). Migrate inline apiCallForSpaHelper calls.
    status: pending
  - id: agent-rules
    content: "Add 3 new agent rules: WIDGET-PATTERNS.md, CLIENT-SERVICES.md, FILE-NAMING.md to .agent/rules/"
    status: pending
  - id: shorten-filenames
    content: Remove redundant scope prefixes from file names (Provider*, Public*, Staff*, Student*, Global*) where the folder path already provides context.
    status: pending
  - id: standardize-route-groups
    content: "Standardize route groups: always (screens) not (pages), remove single-file route groups, colocate PageClient files with page.tsx."
    status: pending
  - id: common-i18n
    content: Add common.az.json, common.en.json, common.ru.json for shared translation strings (buttons, errors, labels).
    status: pending
  - id: split-large-widgets
    content: Extract hooks from widgets over 150 lines (e.g., ProviderQuestionFormWidget -> useQuestionForm.ts + QuestionFormWidget.tsx).
    status: pending
isProject: false
---

# AI-Optimized Codebase Reorganization

## Current State Summary

The codebase has **~270+ UI files**, **153 API routes**, **11 domain modules**, **120 i18n files**, and **12 agent rules**.

The `lib/` folder was recently refactored to cleaner names:

- `app-core-modules/` -> `domain/` (business logic by feature)
- `app-infrastructure/` -> `infra/` (database, logging, notifications)
- `app-access-control/` -> `middleware/` (auth, authz, interceptors)
- `app-route-configs/` -> `routes/` (route definitions)
- `editors/` removed

Current `lib/` structure: `domain/`, `infra/`, `integrations/`, `intelligence/`, `middleware/`, `routes/`, `utils/`

The top-level monorepo structure (`stuwin-monorepo/frameworks/next/`) and `app/` route organization are still unchanged.

---

## Step 1: Flatten Monorepo Root

**Before** (current):

```
STUWIN-MONOREPO/
  stuwin-monorepo/
    frameworks/
      next/        -> actual Next.js app
      expo/        -> actual Expo app
    packages/
      shared/
```

**After** (proposed):

```
STUWIN-MONOREPO/
  apps/
    web/           -> Next.js app (was frameworks/next)
    mobile/        -> Expo app (was frameworks/expo)
  packages/
    shared/
```

Shortens every path by ~~3 segments (~~40 chars). Example:

- Before: `stuwin-monorepo/frameworks/next/app/[locale]/workspaces/provider/[workspaceId]/questions/(widgets)/ProviderQuestionFormWidget.tsx`
- After: `apps/web/app/[locale]/workspaces/provider/[workspaceId]/questions/(widgets)/ProviderQuestionFormWidget.tsx`

### Files that need updating (8 config files + 9 doc files)

**Config files (critical - runtime breaks without these):**

1. `**stuwin-monorepo/package.json**` -> move to root as `package.json`
  - Change workspace patterns: `"frameworks/*"` -> `"apps/*"` (packages/* stays the same)
2. `**stuwin-monorepo/turbo.json**` -> move to root as `turbo.json`
  - No content changes needed (uses workspace-relative paths)
3. `**Dockerfile**` -- update all path references:
  - `stuwin-monorepo/package.json` -> `package.json`
  - `stuwin-monorepo/frameworks/next/package.json` -> `apps/web/package.json`
  - `stuwin-monorepo/packages/shared/package.json` -> `packages/shared/package.json`
  - `stuwin-monorepo/` (COPY source) -> `.` (current dir)
  - `frameworks/next/` -> `apps/web/` (all occurrences)
  - `packages/shared/` stays the same
4. `**apps/web/next.config.mjs**` (after move) -- turbopack root:
  - `path.resolve(__dirname, '../../')` -- still resolves correctly (same depth)
5. `**apps/mobile/metro.config.js**` (after move):
  - `path.resolve(projectRoot, "../..")` -- still resolves correctly (same depth)
6. `**apps/web/tsconfig.json**` (after move):
  - All `../../packages/shared/...` paths -- stay the same (same depth from workspace root)
7. `**apps/mobile/tsconfig.json**` (after move):
  - All `../../packages/shared/...` paths -- stay the same (same depth from workspace root)
8. `**scripts/debug-auth.ts**`:
  - `../frameworks/next/...` -> `../apps/web/...`

**No changes needed** (same relative depth):

- `apps/web/lib/domain/types.ts` -- `../../../../packages/shared/...` still works (same depth)
- All internal imports within the web app -- relative paths unchanged
- `@stuwin/shared` workspace references in package.json files -- resolved by package name

**Documentation (update path references):**

- All 9+ `.agent/rules/*.md` files: replace `frameworks/next/` with `apps/web/`

### Execution script

Per AGENT-BASE-RULES.md ("Always use JavaScript scripting for massive changes"), use a Bun script:

```javascript
// flatten-monorepo.js - Run from repo root
import { $ } from "bun";

// 1. Create new structure
await $`mkdir -p apps`;

// 2. Move frameworks to apps
await $`mv stuwin-monorepo/frameworks/next apps/web`;
await $`mv stuwin-monorepo/frameworks/expo apps/mobile`;

// 3. Move packages to root
await $`mv stuwin-monorepo/packages packages`;

// 4. Move workspace config to root
await $`mv stuwin-monorepo/package.json package.json`;
await $`mv stuwin-monorepo/turbo.json turbo.json`;
await $`mv stuwin-monorepo/bun.lock bun.lock`;  // if exists

// 5. Remove empty stuwin-monorepo folder
await $`rm -rf stuwin-monorepo`;

// 6. Update package.json workspace patterns
// (manual edit: "frameworks/*" -> "apps/*")

// 7. Reinstall dependencies
await $`bun install`;

// 8. Verify build
await $`bun x turbo build`;
```

Then manually update: Dockerfile, scripts/debug-auth.ts, .agent/rules/*.md

---

## Problem 2: Redundant File Name Prefixes (High)

File names encode the entire path hierarchy, creating massive redundancy:


| Current Name                     | Path Already Tells You                                 |
| -------------------------------- | ------------------------------------------------------ |
| `ProviderQuestionFormWidget.tsx` | It's in `workspaces/provider/.../questions/(widgets)/` |
| `PublicProvidersListWidget.tsx`  | It's in `(public)/providers/(widgets)/`                |
| `StaffBlogEditWidget.tsx`        | It's in `workspaces/staff/.../blogs/(widgets)/`        |
| `StudentQuizResultsWidget.tsx`   | It's in `workspaces/student/.../quizzes/(widgets)/`    |


**Proposed convention**: Drop the scope prefix since the folder path already provides context. Keep the `Widget`/`Tile` suffix for type identification.

- `ProviderQuestionFormWidget.tsx` -> `QuestionFormWidget.tsx`
- `PublicProvidersListWidget.tsx` -> `ProvidersListWidget.tsx`
- `StaffBlogEditWidget.tsx` -> `BlogEditWidget.tsx`
- `GlobalPaginationTile.tsx` -> `PaginationTile.tsx`

**Exception**: Keep prefixes when files are imported cross-boundary (e.g., a provider widget used inside student routes). These are rare.

**Impact**: Shorter file names = fewer tokens per reference, less typing, clearer purpose.

---

## Problem 3: No Client Service Layer (High)

Widgets call `apiCallForSpaHelper` directly with inline URL strings. This scatters API knowledge across 100+ files:

```typescript
// Current: URL + error handling duplicated in every widget
const response = await apiCallForSpaHelper({
  url: `/api/workspaces/provider/${workspaceId}/questions`,
  method: 'GET',
});
```

**Proposed**: Create a `services/` folder at each workspace scope level with typed client services:

```
apps/web/app/[locale]/workspaces/provider/[workspaceId]/
  _services/                          # Route group that doesn't affect URL
    questions.service.ts              # All question API calls
    subjects.service.ts               # All subject API calls
    topics.service.ts                 # All topic API calls
```

Or alternatively, a centralized approach alongside the existing `lib/` layers:

```
apps/web/lib/client-services/
  base.client.ts              # Shared error handling, response parsing
  provider/
    questions.client.ts
    subjects.client.ts
    topics.client.ts
  student/
    quizzes.client.ts
    homeworks.client.ts
  public/
    providers.client.ts
    subjects.client.ts
  staff/
    blogs.client.ts
```

This gives AI a single place to look up API contracts and reduces widget coupling.

---

## Problem 4: Scattered Public Service Files (Medium)

Service files like `PublicProvidersService.ts`, `PublicSubjectsService.ts` are colocated inside route directories where they're hard to discover:

```
(public)/providers/PublicProvidersService.ts
(public)/subjects/PublicSubjectsService.ts
(public)/programs/PublicProgramsService.ts
```

**Proposed**: Move all client-side services to a central `lib/client-services/` directory (as described above). This creates a single "service registry" an AI can index quickly.

---

## Problem 5: Inconsistent Route Groups (Medium)

Current inconsistencies:

- `(screens)` vs `(pages)` -- both serve the same purpose
- `(providers)` in `(global)` contains a single file
- Some `(widgets)` folders have a single file
- `*PageClient.tsx` files sometimes sit beside `(screens)/page.tsx`, sometimes inside it

**Proposed convention**:

- **Always** use `(screens)/` for `page.tsx` files (drop `(pages)/`)
- Only create `(widgets)/` when there are 2+ widget files; otherwise colocate
- `*PageClient.tsx` should always live inside `(screens)/` next to its `page.tsx`
- Drop single-file route groups -- they add depth without benefit

---

## Problem 6: Widget Files Mix Too Many Concerns (Medium)

Some widgets are 300+ lines with inline API calls, validation, state management, and UI rendering. AI struggles to make targeted edits in long files.

**Proposed pattern** (document in agent rules):

- Widgets under 150 lines: keep as-is
- Widgets over 150 lines: extract a companion hook (`useQuestionForm.ts`) or split into sub-widgets
- API calls always go through a service layer, never inline

---

## Problem 7: i18n File Fragmentation (Low-Medium)

168 JSON files with component-scoped names (e.g., `AuthLoginWidget.az.json`). Common strings (buttons, errors, labels) are duplicated.

**Proposed**:

- Add `common.az.json`, `common.en.json`, `common.ru.json` for shared strings
- Keep component-scoped files for domain-specific translations
- Document the pattern in agent rules

---

## Problem 8: Missing Agent Rules (Medium)

The existing 12 rules cover architecture well but miss practical coding patterns. Add rules for:

1. **WIDGET-PATTERNS.md** -- Max size, hook extraction, service usage
2. **CLIENT-SERVICES.md** -- Where to place client services, error handling pattern, base service class
3. **FILE-NAMING.md** -- Naming conventions, when to use prefixes, suffix rules (Widget/Tile/Service)

---

## Proposed Final Structure

```
STUWIN-MONOREPO/
  .agent/rules/                          # Agent rules (add 3 new)
  apps/
    web/                                 # Next.js app (was stuwin-monorepo/frameworks/next)
      app/
        [locale]/
          (global)/                      # Shared global components
          (public)/                      # Public pages
          auth/                          # Auth pages
          workspaces/
            (root)/                      # Workspace root
            provider/[workspaceId]/      # Provider workspace
            staff/[workspaceId]/         # Staff workspace
            student/[workspaceId]/       # Student workspace
        api/                             # API routes (unchanged)
      drizzle/                           # Migrations
      i18n/                              # Translations (add common.*.json)
      lib/
        domain/                          # Business logic (already refactored)
        infra/                           # DB, logging, notifications (already refactored)
        middleware/                       # Auth/authz (already refactored)
        routes/                          # Route definitions (already refactored)
        client-services/                 # NEW: Client-side service layer
          base.client.ts                 # Base service with error handling
          provider/
          student/
          public/
          staff/
        integrations/                    # External services (unchanged)
        intelligence/                    # AI/ML prompts (unchanged)
        utils/                           # Utilities (unchanged)
      public/
      types/
    mobile/                              # Expo app (was stuwin-monorepo/frameworks/expo)
  packages/
    shared/                              # Shared types/utils
  scripts/
  turbo.json
  package.json
  Dockerfile
```

---

## Implementation Priority

Changes are ordered by **impact-to-effort ratio**:

1. **Flatten monorepo root** (apps/web, apps/mobile, packages/shared) -- high impact, one-time effort
2. **Create client service layer** with base class -- eliminates duplication across 50+ files
3. **Add missing agent rules** (3 new files) -- immediate AI productivity gain
4. **Shorten file name prefixes** -- can be done incrementally per feature area
5. **Standardize route groups** -- low risk, do during normal feature work
6. **Add common i18n files** -- reduces translation duplication
7. **Split large widgets** -- do opportunistically when editing them

---

## Risk Mitigation

- **Import paths**: After flattening, update `tsconfig.json` path aliases and `turbo.json` workspace patterns. Run `bun x turbo build` to verify.
- **File renames**: Use a script (as per AGENT-BASE-RULES.md "Massive Changes" rule) for bulk renames to avoid broken imports.
- **Incremental adoption**: Shortening file names and splitting widgets can be done area-by-area, not all at once.

