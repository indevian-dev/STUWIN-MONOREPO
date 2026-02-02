# Monorepo Architecture

## 1. Overview
The codebase is a **Turborepo**-managed monorepo designed for maximum code sharing between Web (Next.js) and Mobile (Expo/React Native). The architecture strictly separates **Framework Layouts** (Platform specific) from **Business Logic** (Platform Agnostic).

## 2. Key Directories & Files
- **Root:** `./` (Turborepo config, package.json)
- **Web App:** `frameworks/next/` (Next.js 14+ App Router)
- **Mobile App:** `frameworks/expo/` (React Native/Expo)
- **Shared Logic:** `packages/shared/` (Utils, Types, Constants)
- **Core Modules:** `frameworks/next/lib/app-core-modules/` (The "Brain" of the backend)

## 3. Architecture & Patterns

### The "Core Modules" Pattern
Located in `frameworks/next/lib/app-core-modules/`, this folder contains the implementation of the Clean Architecture:
- **Domains:** (e.g., `inventory`, `auth`, `workspace`)
- **Services:** Business logic (e.g., `InventoryService`).
- **Repositories:** Database access (e.g., `InventoryRepository`).
- **Factories:** Dependency Injection (`ModuleFactory`).

This structure guarantees that the API Routes (`app/api/...`) are extremely thin, only acting as HTTP controllers that delegate work to `Core Modules`.

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** place business logic in *Services* (`lib/app-core-modules/...`), not in API Routes or UI Components.
- **ALWAYS** place database queries in *Repositories*. Services should rely on Repositories, not `db` directly.
- **NEVER** import `next/*` (like `next/navigation`) into `lib/app-infrastructure` or `packages/shared`. These layers must remain framework-agnostic where possible.
- **DO** use the `ModuleFactory` to instantiate services. This centralizes dependency wiring.
- **DO** keep the `frameworks/expo` and `frameworks/next` completely independent dependencies. They should share code via `packages/*` or by structural parity, not by direct imports across framework boundaries.
