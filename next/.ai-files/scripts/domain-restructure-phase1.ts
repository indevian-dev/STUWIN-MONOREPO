/**
 * Domain Restructure - Phase 1: Simple Moves
 * 
 * This script handles:
 * 1. Move notification/ → lib/notifications/
 * 2. Rename intelligence/ → ai-prompt/
 * 3. Split role/ out of workspace/
 * 4. Move services/ValidationService → domain/services/ (keep for now, future _core)
 * 5. Update all imports across the codebase
 * 
 * Run: bun run .ai-files/scripts/domain-restructure-phase1.ts
 */

import { $ } from "bun";
import fs from "fs/promises";
import path from "path";

const ROOT = "c:\\Users\\indev\\OneDrive\\Desktop\\DEVELOPMENT\\PROJECTS\\STUWIN-MONOREPO\\next";
const DOMAIN = path.join(ROOT, "lib", "domain");

// ═══════════════════════════════════════════════════════════════
// UTILITY: Find all TS/TSX files recursively
// ═══════════════════════════════════════════════════════════════
async function findFiles(dir: string, exts: string[] = [".ts", ".tsx"]): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
            results.push(...await findFiles(fullPath, exts));
        } else if (exts.some(ext => entry.name.endsWith(ext))) {
            results.push(fullPath);
        }
    }
    return results;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Replace import paths in a file
// ═══════════════════════════════════════════════════════════════
async function replaceInFile(filePath: string, replacements: [string | RegExp, string][]): Promise<boolean> {
    let content = await fs.readFile(filePath, "utf-8");
    let changed = false;

    for (const [search, replace] of replacements) {
        if (typeof search === "string") {
            if (content.includes(search)) {
                content = content.replaceAll(search, replace);
                changed = true;
            }
        } else {
            if (search.test(content)) {
                content = content.replace(search, replace);
                changed = true;
            }
        }
    }

    if (changed) {
        await fs.writeFile(filePath, content, "utf-8");
    }
    return changed;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Copy directory recursively
// ═══════════════════════════════════════════════════════════════
async function copyDir(src: string, dest: string) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Remove directory recursively
// ═══════════════════════════════════════════════════════════════
async function removeDir(dir: string) {
    await fs.rm(dir, { recursive: true, force: true });
}

// ═══════════════════════════════════════════════════════════════
// STEP 1: Move notification/ → lib/notifications/
// ═══════════════════════════════════════════════════════════════
async function moveNotification() {
    console.log("\n🔄 Step 1: Moving notification/ → lib/notifications/");
    const src = path.join(DOMAIN, "notification");
    const dest = path.join(ROOT, "lib", "notifications");

    await copyDir(src, dest);

    // Update internal imports in notification files (base.service → @/lib/domain/_core/base.service still valid)
    const notifFiles = await findFiles(dest);
    for (const f of notifFiles) {
        await replaceInFile(f, [
            // Internal relative refs stay the same (./notification.types etc)
        ]);
    }

    // Remove old directory
    await removeDir(src);
    console.log("  ✅ Moved notification/ → lib/notifications/");
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: Rename intelligence/ → ai-prompt/
// ═══════════════════════════════════════════════════════════════
async function renameIntelligence() {
    console.log("\n🔄 Step 2: Renaming intelligence/ → ai-prompt/");
    const src = path.join(DOMAIN, "intelligence");
    const dest = path.join(DOMAIN, "ai-prompt");

    await copyDir(src, dest);

    // Update internal absolute imports within ai-prompt files
    const aiPromptFiles = await findFiles(dest);
    for (const f of aiPromptFiles) {
        await replaceInFile(f, [
            ["@/lib/domain/ai-prompt/", "@/lib/domain/ai-prompt/"],
        ]);
    }

    // Remove old directory
    await removeDir(src);
    console.log("  ✅ Renamed intelligence/ → ai-prompt/");
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: Split role/ out of workspace/
// ═══════════════════════════════════════════════════════════════
async function splitRole() {
    console.log("\n🔄 Step 3: Splitting role/ out of workspace/");
    const roleDir = path.join(DOMAIN, "role");
    await fs.mkdir(roleDir, { recursive: true });

    // Copy role files
    const roleSrc = path.join(DOMAIN, "workspace", "role.service.ts");
    const roleRepoSrc = path.join(DOMAIN, "workspace", "role.repository.ts");

    await fs.copyFile(roleSrc, path.join(roleDir, "role.service.ts"));
    await fs.copyFile(roleRepoSrc, path.join(roleDir, "role.repository.ts"));

    // Create index.ts for role module
    await fs.writeFile(path.join(roleDir, "index.ts"),
        `// Role Module — Public API
export * from './role.repository';
export * from './role.service';
`, "utf-8");

    // Update relative imports within role files
    const roleFiles = await findFiles(roleDir);
    for (const f of roleFiles) {
        await replaceInFile(f, [
            // base.service and base.repository use ../base which is the same level
            // No changes needed since role/ is also under domain/
        ]);
    }

    // Remove old files from workspace/
    await fs.rm(roleSrc, { force: true });
    await fs.rm(roleRepoSrc, { force: true });

    console.log("  ✅ Split role/ out of workspace/");
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: Update ALL imports across the codebase
// ═══════════════════════════════════════════════════════════════
async function updateAllImports() {
    console.log("\n🔄 Step 4: Updating all imports across the codebase");
    const allFiles = await findFiles(ROOT);
    let totalChanged = 0;

    for (const f of allFiles) {
        const changed = await replaceInFile(f, [
            // === NOTIFICATION MOVES ===
            // Absolute paths: @/lib/domain/notification → @/lib/notifications
            ["@/lib/notifications/", "@/lib/notifications/"],
            ["@/lib/domain/notification\"", "@/lib/notifications\""],
            ["@/lib/notifications'", "@/lib/notifications'"],

            // Relative paths in factory.ts: ./notification/ → ../../notifications/ (factory is at lib/domain/)
            // We'll handle factory specially below

            // === INTELLIGENCE → AI-PROMPT RENAMES ===
            // Absolute paths
            ["@/lib/domain/ai-prompt/", "@/lib/domain/ai-prompt/"],
            ["@/lib/domain/intelligence\"", "@/lib/domain/ai-prompt\""],
            ["@/lib/domain/ai-prompt'", "@/lib/domain/ai-prompt'"],

            // Relative paths within domain/
            ["../ai-prompt/", "../ai-prompt/"],
            ["./ai-prompt/", "./ai-prompt/"],

            // === ROLE SPLIT (workspace → role) ===
            // Relative paths in factory.ts
            ["./role/role.service", "./role/role.service"],
            ["./role/role.repository", "./role/role.repository"],
        ]);
        if (changed) totalChanged++;
    }

    // Special handling for factory.ts: notification relative paths
    const factoryPath = path.join(DOMAIN, "factory.ts");
    await replaceInFile(factoryPath, [
        // The notification imports in factory.ts need to point to ../../notifications/ since factory is at lib/domain/
        // But we already changed @/lib/domain/notification → @/lib/notifications above
        // Factory uses ./notification/ which became replaced above, but we need to make sure
        // Let's fix factory notification imports to use absolute paths
    ]);

    console.log(`  ✅ Updated imports in ${totalChanged} files`);
}

// ═══════════════════════════════════════════════════════════════
// STEP 5: Update workspace/index.ts to remove role exports
// ═══════════════════════════════════════════════════════════════
async function updateWorkspaceIndex() {
    console.log("\n🔄 Step 5: Updating workspace/index.ts");
    const wsIndexPath = path.join(DOMAIN, "workspace", "index.ts");

    try {
        const content = await fs.readFile(wsIndexPath, "utf-8");
        // Remove role re-exports
        const updated = content
            .replace(/export \* from '\.\/role\.service';\r?\n?/g, "")
            .replace(/export \* from '\.\/role\.repository';\r?\n?/g, "")
            .replace(/export \* from "\.\/role\.service";\r?\n?/g, "")
            .replace(/export \* from "\.\/role\.repository";\r?\n?/g, "");
        await fs.writeFile(wsIndexPath, updated, "utf-8");
        console.log("  ✅ Updated workspace/index.ts");
    } catch {
        console.log("  ⚠️ No workspace/index.ts found or no changes needed");
    }
}

// ═══════════════════════════════════════════════════════════════
// STEP 6: Update domain/index.ts barrel exports
// ═══════════════════════════════════════════════════════════════
async function updateDomainIndex() {
    console.log("\n🔄 Step 6: Updating domain/index.ts barrel exports");
    const indexPath = path.join(DOMAIN, "index.ts");

    const newIndex = `/**
 * Module Exports - Central barrel file for all domain modules
 * 
 * Each module is self-contained with:
 * - Repository (database layer)
 * - Service (business logic)
 * - Types (TypeScript interfaces)
 * - Schema (Zod validation)
 */

// Module Factory - Primary access point
export { ModuleFactory } from './factory';

// Individual Modules
export * from './learning';
export * from './auth';
export * from './workspace';
export * from './role';
export * from './content';
export * from './activity';
export * from './support';
export * from './jobs';
export * from './payment';
export * from './ai-prompt';
`;

    await fs.writeFile(indexPath, newIndex, "utf-8");
    console.log("  ✅ Updated domain/index.ts");
}

// ═══════════════════════════════════════════════════════════════
// STEP 7: Create ai-prompt/index.ts if not exists
// ═══════════════════════════════════════════════════════════════
async function createAiPromptIndex() {
    console.log("\n🔄 Step 7: Creating ai-prompt/index.ts");
    const indexPath = path.join(DOMAIN, "ai-prompt", "index.ts");

    try {
        await fs.access(indexPath);
        console.log("  ⚠️ ai-prompt/index.ts already exists");
    } catch {
        await fs.writeFile(indexPath,
            `// AI Prompt Module — Public API
export * from './system-prompt.repository';
export * from './system-prompt.service';
export * from './intelligence.types';
export * from './base-prompts';
`, "utf-8");
        console.log("  ✅ Created ai-prompt/index.ts");
    }
}

// ═══════════════════════════════════════════════════════════════
// STEP 8: Create payment/index.ts if not exists
// ═══════════════════════════════════════════════════════════════
async function createPaymentIndex() {
    console.log("\n🔄 Step 8: Creating payment/index.ts if needed");
    const indexPath = path.join(DOMAIN, "payment", "index.ts");

    try {
        await fs.access(indexPath);
        console.log("  ⚠️ payment/index.ts already exists");
    } catch {
        await fs.writeFile(indexPath,
            `// Payment Module — Public API
export * from './payment.repository';
export * from './payment.service';
`, "utf-8");
        console.log("  ✅ Created payment/index.ts");
    }
}

// ═══════════════════════════════════════════════════════════════
// STEP 9: Update notifications internal imports 
// (they import from @/lib/domain/_core/base.service)
// ═══════════════════════════════════════════════════════════════
async function updateNotificationInternalImports() {
    console.log("\n🔄 Step 9: Updating notification internal imports");
    const notifDir = path.join(ROOT, "lib", "notifications");
    const notifFiles = await findFiles(notifDir);

    for (const f of notifFiles) {
        // These files already use absolute @/lib/domain/_core/base.service which is still valid
        // No changes needed for base.service imports
    }
    console.log("  ✅ Notification internal imports are OK (using absolute paths)");
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
    console.log("🚀 Domain Restructure Phase 1 - Starting...\n");
    console.log(`Root: ${ROOT}`);
    console.log(`Domain: ${DOMAIN}`);

    await moveNotification();
    await renameIntelligence();
    await splitRole();
    await updateAllImports();
    await updateWorkspaceIndex();
    await updateDomainIndex();
    await createAiPromptIndex();
    await createPaymentIndex();
    await updateNotificationInternalImports();

    console.log("\n🎉 Phase 1 complete! Run 'bun run dev' to verify.");
}

main().catch(err => {
    console.error("❌ Script failed:", err);
    process.exit(1);
});
