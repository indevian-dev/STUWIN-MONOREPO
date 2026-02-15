import postgres from "postgres";

// ═══════════════════════════════════════════════════════════════
// PARADEDB CLIENT (SEARCH DATABASE — Neon PgSQL + pg_search)
// ═══════════════════════════════════════════════════════════════

const paradeDbClient = postgres(process.env.SEARCH_DATABASE_URL!, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
});

export { paradeDbClient };
