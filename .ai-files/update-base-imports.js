/**
 * Script: Update all base class imports from shared/ to domain root
 * Handles both relative (../shared/base.*) and alias (@/lib/domain/shared/base.*) paths
 */
const fs = require('fs');
const path = require('path');

const domainDir = path.join(__dirname, '..', 'next', 'lib', 'domain');

// Recursively find all .ts files
function findTsFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findTsFiles(fullPath));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            results.push(fullPath);
        }
    }
    return results;
}

const files = findTsFiles(domainDir);
let totalChanges = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;

    const relPath = path.relative(domainDir, file);
    const depth = relPath.split(path.sep).length - 1; // How many dirs deep from domain/

    // Skip the base files themselves
    if (file.endsWith('base.service.ts') && path.dirname(file) === domainDir) continue;
    if (file.endsWith('base.repository.ts') && path.dirname(file) === domainDir) continue;

    // For files directly in domain/ (like factory.ts)
    if (depth === 0) {
        // from "../shared/base.service" -> "./base.service"
        content = content.replace(/from\s+['"]\.\/shared\/base\.service['"]/g, 'from "./base.service"');
        content = content.replace(/from\s+['"]\.\/shared\/base\.repository['"]/g, 'from "./base.repository"');
        // from "@/lib/domain/shared/base.service" -> "./base.service"
        content = content.replace(/from\s+['"]@\/lib\/domain\/shared\/base\.service['"]/g, 'from "./base.service"');
        content = content.replace(/from\s+['"]@\/lib\/domain\/shared\/base\.repository['"]/g, 'from "./base.repository"');
    } else {
        // For files in subdirectories like learning/, auth/, etc.
        // from "../shared/base.service" -> "../base.service"
        content = content.replace(/from\s+['"]\.\.\/shared\/base\.service['"]/g, 'from "../base.service"');
        content = content.replace(/from\s+['"]\.\.\/shared\/base\.repository['"]/g, 'from "../base.repository"');
        // from "@/lib/domain/shared/base.service" -> "@/lib/domain/base.service"
        content = content.replace(/from\s+['"]@\/lib\/domain\/shared\/base\.service['"]/g, 'from "@/lib/domain/base.service"');
        content = content.replace(/from\s+['"]@\/lib\/domain\/shared\/base\.repository['"]/g, 'from "@/lib/domain/base.repository"');
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        totalChanges++;
        console.log(`✓ Updated: ${relPath}`);
    }
}

console.log(`\nDone! Updated ${totalChanges} files.`);
