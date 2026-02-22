/**
 * Backfill script: Generate topic_vector for all existing topics
 * 
 * Usage: bun run scripts/backfill-topic-vectors.ts
 * 
 * This script fetches all topics that don't have a topic_vector yet,
 * generates embeddings from their name + description, and saves them.
 */

import { db } from "../lib/database";
import { providerSubjectTopics } from "../lib/database/schema";
import { isNull } from "drizzle-orm";
import { SemanticMasteryService } from "../lib/domain/semantic-mastery/SemanticMastery.service";

async function backfillTopicVectors() {
    const semanticMastery = new SemanticMasteryService();

    // Get all topics without a topic_vector
    const topics = await db.select({
        id: providerSubjectTopics.id,
        name: providerSubjectTopics.name,
        description: providerSubjectTopics.description,
    })
        .from(providerSubjectTopics)
        .where(isNull(providerSubjectTopics.topicVector));

    console.log(`[Backfill] Found ${topics.length} topics without topic_vector`);

    let success = 0;
    let failed = 0;

    for (const topic of topics) {
        try {
            if (!topic.name) {
                console.log(`[Backfill] Skipping topic ${topic.id} — no name`);
                failed++;
                continue;
            }

            await semanticMastery.generateAndSaveTopicVector(
                topic.id,
                topic.name,
                topic.description || undefined
            );

            success++;
            console.log(`[Backfill] ✅ ${success}/${topics.length} — ${topic.name}`);

            // Rate limit: Google API allows ~100 QPM for embeddings
            if (success % 50 === 0) {
                console.log("[Backfill] Pausing 30s for rate limit...");
                await new Promise(resolve => setTimeout(resolve, 30_000));
            }
        } catch (err) {
            failed++;
            console.error(`[Backfill] ❌ Failed for topic ${topic.id} (${topic.name}):`, err);
        }
    }

    console.log(`\n[Backfill] Complete! ✅ ${success} succeeded, ❌ ${failed} failed out of ${topics.length} total`);
    process.exit(0);
}

backfillTopicVectors();
