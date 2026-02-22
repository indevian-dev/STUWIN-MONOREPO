/**
 * Script to fix all untyped fetchApiUtil({ calls by adding <any> type parameter.
 * 
 * This fixes TypeScript errors where 'response' is of type 'unknown' because
 * fetchApiUtil<T> defaults T to unknown when no type param is provided.
 * 
 * Pattern: `fetchApiUtil({` → `fetchApiUtil<any>({`
 * Skips lines that already have a type parameter like `fetchApiUtil<SomeType>({`
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const ROOT = join(import.meta.dirname, '..');
const EXTENSIONS = new Set(['.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', '.ai-files']);

async function* walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) {
                yield* walk(fullPath);
            }
        } else if (EXTENSIONS.has(extname(entry.name))) {
            yield fullPath;
        }
    }
}

let totalFiles = 0;
let totalReplacements = 0;

for await (const filePath of walk(ROOT)) {
    const content = await readFile(filePath, 'utf-8');

    // Match fetchApiUtil({ but NOT fetchApiUtil<...>({
    // We look for `fetchApiUtil({` without a `<` before the `(`
    const pattern = /fetchApiUtil\(\{/g;

    if (!pattern.test(content)) continue;

    // Check if it already has type params — skip those
    // Replace only `fetchApiUtil({` with `fetchApiUtil<any>({`
    // But don't touch lines that already have `fetchApiUtil<`
    const newContent = content.replace(
        /fetchApiUtil(?!<)\(\{/g,
        'fetchApiUtil<any>({\n'
    );

    // Oops, that adds a newline. Let me fix the approach.
    const newContent2 = content.replace(
        /fetchApiUtil(?!<)\(\{/g,
        'fetchApiUtil<any>({'
    );

    if (newContent2 !== content) {
        const count = (content.match(/fetchApiUtil(?!<)\(\{/g) || []).length;
        await writeFile(filePath, newContent2, 'utf-8');
        totalFiles++;
        totalReplacements += count;
        console.log(`✅ ${filePath.replace(ROOT, '')} — ${count} replacement(s)`);
    }
}

console.log(`\nDone! Fixed ${totalReplacements} calls across ${totalFiles} files.`);
