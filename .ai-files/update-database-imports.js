/**
 * Script: Mass update imports for the full lib restructure
 * Updates: infra/database → database, infra/logging → logging
 */
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', 'next');

function findFiles(dir, exts = ['.ts', '.tsx']) {
    const results = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.next') {
                results.push(...findFiles(fullPath, exts));
            } else if (exts.some(ext => entry.name.endsWith(ext))) {
                results.push(fullPath);
            }
        }
    } catch (e) { }
    return results;
}

const files = findFiles(nextDir);
let totalChanges = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;

    // infra/database → database
    content = content.replace(/@\/lib\/infra\/database/g, '@/lib/database');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        totalChanges++;
        const rel = path.relative(nextDir, file);
        console.log(`✓ ${rel}`);
    }
}

console.log(`\nDone! Updated ${totalChanges} files for database imports.`);
