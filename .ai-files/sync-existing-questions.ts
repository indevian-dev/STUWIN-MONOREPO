/**
 * Re-sync all existing questions from Supabase → Neon using snake_case keys
 * (matching to_jsonb(NEW) from the FDW trigger)
 * Run: bun run ../.ai-files/sync-existing-questions.ts
 */
import postgres from "postgres";
import "dotenv/config";

const supabase = postgres(process.env.DATABASE_URL!);
const paradeDb = postgres(process.env.SEARCH_DATABASE_URL!);

async function main() {
    console.log("🔍 Fetching all questions from Supabase...");

    const questions = await supabase`
        SELECT * FROM provider_questions
    `;

    console.log(`📦 Found ${questions.length} questions`);

    // Clear existing data (re-sync with new key format)
    await paradeDb`TRUNCATE search_questions`;
    console.log("🗑️  Cleared existing search index");

    let synced = 0;
    let failed = 0;

    for (const row of questions) {
        try {
            // Use to_jsonb-compatible format (snake_case keys, same as Postgres columns)
            const data = JSON.stringify(row);

            await paradeDb`
                INSERT INTO search_questions (id, workspace_id, data, synced_at)
                VALUES (${row.id}, ${row.workspace_id || ''}, ${data}::jsonb, NOW())
            `;
            synced++;
        } catch (err) {
            failed++;
            console.error(`❌ Failed to sync question ${row.id}:`, err instanceof Error ? err.message : err);
        }
    }

    console.log(`\n✅ Sync complete: ${synced} synced, ${failed} failed`);

    const count = await paradeDb`SELECT COUNT(*)::int AS total FROM search_questions`;
    console.log(`📊 Total questions in search index: ${count[0].total}`);

    await supabase.end();
    await paradeDb.end();
}

main().catch(console.error);
