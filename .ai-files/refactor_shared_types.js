/**
 * Batch-replace @/types imports → @stuwin/shared/types
 * 
 * Handles:
 *   from "@/types"           → from "@stuwin/shared/types"
 *   from '@/types'           → from '@stuwin/shared/types'
 *   from "@/types/domain/x"  → from "@stuwin/shared/types/domain/x"
 *   from '@/types/auth/y'    → from '@stuwin/shared/types/auth/y'
 */

const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '..', 'next');

// Recursively find all .ts and .tsx files
function findFiles(dir, result = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.next') continue;
            findFiles(fullPath, result);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            result.push(fullPath);
        }
    }
    return result;
}

// Regex to match: from "@/types..." or from '@/types...'
// Captures the quote style and any subpath after @/types
const IMPORT_REGEX = /from\s+(["'])@\/types(\/[^"']*)?(\1)/g;

let totalFiles = 0;
let totalReplacements = 0;

const files = findFiles(NEXT_DIR);

for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');

    const newContent = content.replace(IMPORT_REGEX, (match, quote, subpath, _q2) => {
        const sub = subpath || '';
        return `from ${quote}@stuwin/shared/types${sub}${quote}`;
    });

    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        totalFiles++;
        // Count replacements
        const matches = content.match(IMPORT_REGEX);
        totalReplacements += matches ? matches.length : 0;
        const rel = path.relative(NEXT_DIR, filePath);
        console.log(`  ✓ ${rel} (${matches ? matches.length : 0} replacements)`);
    }
}

console.log(`\nDone: ${totalReplacements} replacements across ${totalFiles} files.`);
