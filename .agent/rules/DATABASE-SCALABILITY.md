# Database & Scalability

## 1. Overview
We use **PostgreSQL** driven by a modern **ORM**. The data architecture is designed for **Multi-Tenancy** and **Horizontal Scalability**.
- **Tenancy:** We use "Logical Sharding" where `workspaceId` acts as the Partition Key.
- **Scalability:** This design allows us to split the database onto multiple physical servers (using Citus or similar) in the future without rewriting application code.

## 2. Key Directories & Files
- **Schema:** `frameworks/next/lib/app-infrastructure/database/schema.ts` (Model definition source).
- **Client:** `frameworks/next/lib/app-infrastructure/database/index.ts` (Singleton DB Client).
- **Migrations:** `frameworks/next/lib/app-infrastructure/database/migrations/` (SQL history).
- **Seeds:** `frameworks/next/lib/app-infrastructure/database/seeds/` (Initial data population).

## 3. Architecture & Patterns

### The `workspaceId` Rule
Every entity that "belongs" to a workspace (Quizzes, Homeworks, Students) **MUST** have a `workspaceId` column.
- **Querying:** `db.query.quizzes.findMany({ where: (q, { eq }) => eq(q.workspaceId, ctx.workspaceId) })`
- **Indexing:** Indexes should almost always be compound: `index("name").on(table.workspaceId, table.status)`.

### Transaction Safety
Complex operations (e.g., "Start Quiz") must start and finish atomically.
- Use `db.transaction(async (tx) => { ... })`.
- This prevents "Orphaned Data" (e.g., A Quiz Session created without the linked Quiz record).

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** respect the unique constraints and foreign keys defined in `schema.ts`.
- **ALWAYS** use `db.transaction` for multi-step writes.
- **NEVER** perform "Cross-Workspace" joins unless explicitly building a Super-Admin feature.
- **DO** use Drizzle's Relational Queries (`db.query`) and `with: { ... }` to fetch relations efficiently.
- **DO** use `Soft Delete` (e.g., `deletedAt` column) for critical user data instead of raw `delete()`, unless instructed otherwise.
