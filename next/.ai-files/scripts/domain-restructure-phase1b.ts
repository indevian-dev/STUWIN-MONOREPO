/**
 * Domain Restructure - Phase 1B: Core setup & cleanup
 * 
 * This script handles:
 * 1. Create _core/ dir with BaseService, BaseRepository, types.ts
 * 2. Move ValidationService to _core/
 * 3. Update all imports across the codebase
 * 4. Leave services/question-generation.service.ts untouched (Phase 2)
 * 
 * Run: bun run .ai-files/scripts/domain-restructure-phase1b.ts
 */

import fs from "fs/promises";
import path from "path";

const ROOT = "c:\\Users\\indev\\OneDrive\\Desktop\\DEVELOPMENT\\PROJECTS\\STUWIN-MONOREPO\\next";
const DOMAIN = path.join(ROOT, "lib", "domain");

// ═══════════════════════════════════════════════════════════════
// UTILITY: Find all TS/TSX files recursively
// ═══════════════════════════════════════════════════════════════
async function findFiles(dir: string, exts: string[] = [".ts", ".tsx"]): Promise<string[]> {
    const results: string[] = [];
    try {
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
    } catch { }
    return results;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Replace strings in file
// ═══════════════════════════════════════════════════════════════
async function replaceInFile(filePath: string, replacements: [string, string][]): Promise<boolean> {
    let content = await fs.readFile(filePath, "utf-8");
    let changed = false;
    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.replaceAll(search, replace);
            changed = true;
        }
    }
    if (changed) await fs.writeFile(filePath, content, "utf-8");
    return changed;
}

async function main() {
    console.log("🚀 Phase 1B: Core setup & cleanup\n");

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Create _core/ directory
    // ═══════════════════════════════════════════════════════════════
    console.log("🔄 Step 1: Creating _core/ directory");
    const coreDir = path.join(DOMAIN, "_core");
    await fs.mkdir(coreDir, { recursive: true });

    // Move base.service.ts → _core/base.service.ts
    await fs.copyFile(
        path.join(DOMAIN, "base.service.ts"),
        path.join(coreDir, "base.service.ts")
    );

    // Move base.repository.ts → _core/base.repository.ts
    await fs.copyFile(
        path.join(DOMAIN, "base.repository.ts"),
        path.join(coreDir, "base.repository.ts")
    );

    // Move types.ts → _core/types.ts
    await fs.copyFile(
        path.join(DOMAIN, "types.ts"),
        path.join(coreDir, "types.ts")
    );

    // Move ValidationService.ts → _core/validation.service.ts (rename to match convention)
    await fs.copyFile(
        path.join(DOMAIN, "services", "ValidationService.ts"),
        path.join(coreDir, "validation.service.ts")
    );

    // Create _core/index.ts barrel
    await fs.writeFile(path.join(coreDir, "index.ts"),
        `// Core Domain Infrastructure — Public API
export * from './base.service';
export * from './base.repository';
export * from './types';
export * from './validation.service';
`, "utf-8");

    console.log("  ✅ Created _core/ with base files");

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Update all imports across the codebase
    // ═══════════════════════════════════════════════════════════════
    console.log("\n🔄 Step 2: Updating imports");
    const allFiles = await findFiles(ROOT);
    let totalChanged = 0;

    for (const f of allFiles) {
        const changed = await replaceInFile(f, [
            // === base.service / base.repository ABSOLUTE imports ===
            ['@/lib/domain/_core/base.service', '@/lib/domain/_core/base.service'],
            ['@/lib/domain/_core/base.repository', '@/lib/domain/_core/base.repository'],

            // === Relative imports from domain subfolders ===
            // Services use ../base.service → ../_core/base.service
            ['"../_core/base.service"', '"../_core/base.service"'],
            ["'../_core/base.service'", "'../_core/base.service'"],
            ['"../_core/base.repository"', '"../_core/base.repository"'],
            ["'../_core/base.repository'", "'../_core/base.repository'"],

            // === Types ===
            ['@/lib/domain/_core/types', '@/lib/domain/_core/types'],
            ['"../_core/types"', '"../_core/types"'],
            ["'../_core/types'", "'../_core/types'"],

            // === ValidationService ===
            ['@/lib/domain/_core/validation.service', '@/lib/domain/_core/validation.service'],
        ]);
        if (changed) totalChanged++;
    }

    console.log(`  ✅ Updated imports in ${totalChanged} files`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Remove old files (keep originals as compat proxies first)
    // ═══════════════════════════════════════════════════════════════
    console.log("\n🔄 Step 3: Removing old files");

    // Create proxy files at old locations for any imports we might have missed
    // base.service.ts → re-export from _core
    await fs.writeFile(path.join(DOMAIN, "base.service.ts"),
        `// Re-export from _core for backward compatibility
export * from './_core/base.service';
`, "utf-8");

    await fs.writeFile(path.join(DOMAIN, "base.repository.ts"),
        `// Re-export from _core for backward compatibility
export * from './_core/base.repository';
`, "utf-8");

    await fs.writeFile(path.join(DOMAIN, "types.ts"),
        `// Re-export from _core for backward compatibility
export * from './_core/types';
`, "utf-8");

    // Remove ValidationService from services/
    await fs.rm(path.join(DOMAIN, "services", "ValidationService.ts"), { force: true });

    console.log("  ✅ Created backward-compat proxies at old locations");
    console.log("  ✅ Removed ValidationService from services/");

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Check if services/ only has question-generation left
    // ═══════════════════════════════════════════════════════════════
    console.log("\n🔄 Step 4: Checking services/ folder");
    try {
        const remaining = await fs.readdir(path.join(DOMAIN, "services"));
        console.log(`  📦 Remaining in services/: ${remaining.join(", ") || "(empty)"}`);
        if (remaining.length === 0) {
            await fs.rmdir(path.join(DOMAIN, "services"));
            console.log("  ✅ Deleted empty services/ folder");
        }
    } catch {
        console.log("  ⚠️ services/ folder not found");
    }

    console.log("\n🎉 Phase 1B complete!");
}

main().catch(err => {
    console.error("❌ Script failed:", err);
    process.exit(1);
});
