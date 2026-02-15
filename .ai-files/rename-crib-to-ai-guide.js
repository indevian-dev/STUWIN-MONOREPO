/**
 * Rename Script: ai_assistant_crib → ai_guide & system_prompts_crib → ai_system_guides
 * 
 * Bulk find-and-replace across all .ts and .tsx files in the project.
 * Run with: bun .ai-files/rename-crib-to-ai-guide.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// Directories to scan
const SCAN_DIRS = [
    path.join(ROOT, "next"),
    path.join(ROOT, "_shared.types"),
];

// File extensions to process
const EXTENSIONS = [".ts", ".tsx"];

// Replacements (order matters — more specific first)
const REPLACEMENTS = [
    // camelCase property/variable names
    ["aiAssistantCrib", "aiGuide"],
    // snake_case DB column names (in strings)
    ["ai_assistant_crib", "ai_guide"],
    // Table export name (camelCase)
    ["systemPromptsCrib", "aiSystemGuides"],
    // Table DB name (snake_case, in strings)
    ["system_prompts_crib", "ai_system_guides"],
];

function getAllFiles(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
            getAllFiles(fullPath, results);
        } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
            results.push(fullPath);
        }
    }
    return results;
}

let totalFilesChanged = 0;
let totalReplacements = 0;

for (const dir of SCAN_DIRS) {
    const files = getAllFiles(dir);
    for (const filePath of files) {
        let content = fs.readFileSync(filePath, "utf8");
        let originalContent = content;
        let fileReplacements = 0;

        for (const [find, replace] of REPLACEMENTS) {
            const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g");
            const matches = content.match(regex);
            if (matches) {
                fileReplacements += matches.length;
                content = content.replace(regex, replace);
            }
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, "utf8");
            const relPath = path.relative(ROOT, filePath);
            console.log(`  ✅ ${relPath} (${fileReplacements} replacements)`);
            totalFilesChanged++;
            totalReplacements += fileReplacements;
        }
    }
}

console.log(`\n🎯 Done: ${totalFilesChanged} files changed, ${totalReplacements} total replacements`);
