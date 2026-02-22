const fs = require('fs');
const path = require('path');

const NEXT_DIR = process.cwd();
const SHARED_DIR = path.resolve(NEXT_DIR, '../_shared.types');

const DIRS_TO_PATCH = [
    SHARED_DIR,
    path.join(NEXT_DIR, 'app'),
    path.join(NEXT_DIR, 'components'),
    path.join(NEXT_DIR, 'lib'),
    path.join(NEXT_DIR, 'scripts')
];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.next')) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const sharedFiles = walk(SHARED_DIR);
const mappings = {}; // new mappings

// 1. Rename files ending with .index.ts
for (const oldPath of sharedFiles) {
    const ext = path.extname(oldPath);
    if (ext !== '.ts' && ext !== '.tsx') continue;

    const relPath = path.relative(SHARED_DIR, oldPath);
    const dir = path.dirname(relPath);
    const baseName = path.basename(relPath, ext);

    if (baseName.endsWith('.index')) {
        const newBaseName = baseName.replace('.index', '.type');
        const newPath = path.join(SHARED_DIR, dir, `${newBaseName}${ext}`);

        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${relPath} -> ${path.join(dir, newBaseName + ext)}`);

        const oldRelKey = path.join(dir, baseName).replace(/\\/g, '/');
        const newRelKey = path.join(dir, newBaseName).replace(/\\/g, '/');
        mappings[oldRelKey] = newRelKey;
    }
}

console.log('\nMappings built:', Object.keys(mappings).length);

// 2. Patch imports
let modifiedCount = 0;
const allFilesToPatch = DIRS_TO_PATCH.flatMap(d => walk(d));

for (const file of allFilesToPatch) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace absolute imports @stuwin/shared/types/...
    const absoluteRegex = /(['"])@stuwin\/shared\/types\/([^'"]+)(['"])/g;
    content = content.replace(absoluteRegex, (match, prefix, importPath, suffix) => {
        // remove extension
        importPath = importPath.replace(/\.ts$/, '');

        if (mappings[importPath]) {
            changed = true;
            return `${prefix}@stuwin/shared/types/${mappings[importPath]}${suffix}`;
        }
        return match;
    });

    // Replace relative imports (internal to shared or lib)
    const relativeRegex = /((?:import|export)\s+.*from\s+['"])(\.\.?\/[^'"]+)(['"])|(?:import\(['"])(\.\.?\/[^'"]+)(['"]\))/g;
    content = content.replace(relativeRegex, (match, prefix1, importPath1, suffix1, importPath2, suffix2) => {
        const prefix = prefix1 || 'import("';
        const importPath = importPath1 || importPath2;
        const suffix = suffix1 || suffix2;

        if (!importPath.startsWith('.')) return match;

        const absoluteImportDir = path.resolve(path.dirname(file), importPath);
        let relativeToShared = path.relative(SHARED_DIR, absoluteImportDir).replace(/\\/g, '/');

        if (relativeToShared.startsWith('..')) return match;

        if (mappings[relativeToShared]) {
            const mappedAbsolute = path.resolve(SHARED_DIR, mappings[relativeToShared]);
            let newRelative = path.relative(path.dirname(file), mappedAbsolute).replace(/\\/g, '/');
            if (!newRelative.startsWith('.')) newRelative = './' + newRelative;
            changed = true;
            return `${prefix}${newRelative}${suffix}`;
        }

        return match;
    });

    if (changed) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log(`Patched references in: ${file.replace(process.cwd(), '')}`);
    }
}

console.log(`\nPatched ${modifiedCount} files with updated .type.ts index imports.`);
