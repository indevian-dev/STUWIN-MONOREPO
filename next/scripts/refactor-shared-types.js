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

function toPascalCase(str) {
    if (str.includes('-') || str.includes('_')) {
        return str.split(/[-_]+/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

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
const mappings = {}; // oldRelPathWithoutExt -> newRelPathWithoutExt

// 1. Rename files
for (const oldPath of sharedFiles) {
    const ext = path.extname(oldPath);
    if (ext !== '.ts' && ext !== '.tsx') continue;

    const relPath = path.relative(SHARED_DIR, oldPath);
    const dir = path.dirname(relPath);
    const baseName = path.basename(relPath, ext);

    let newBaseName;
    if (baseName === 'index') {
        if (dir === '.') {
            newBaseName = 'Shared.index';
        } else {
            const folderName = path.basename(dir);
            newBaseName = `${toPascalCase(folderName)}.index`;
        }
    } else {
        // user requested .type.ts
        if (baseName.endsWith('.type') || baseName.endsWith('.index')) {
            newBaseName = baseName;
        } else {
            newBaseName = `${toPascalCase(baseName)}.type`;
        }
    }

    const newPath = path.join(SHARED_DIR, dir, `${newBaseName}${ext}`);
    if (oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${relPath} -> ${path.join(dir, newBaseName + ext)}`);
    }

    const oldRelKey = path.join(dir, baseName).replace(/\\/g, '/');
    const newRelKey = path.join(dir, newBaseName).replace(/\\/g, '/');
    mappings[oldRelKey] = newRelKey;
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
        // importPath could be exact, or we might need to resolve it
        // Remove .ts extension if present
        importPath = importPath.replace(/\.ts$/, '');

        let targetKey = importPath;
        if (!mappings[targetKey] && mappings[targetKey + '/index']) {
            targetKey = targetKey + '/index';
        }

        if (mappings[targetKey]) {
            changed = true;
            return `${prefix}@stuwin/shared/types/${mappings[targetKey]}${suffix}`;
        }
        return match; // unchanged
    });

    // Replace relative imports (only inside _shared.types and potentially next/ if they somehow use relative imports to shared)
    const relativeRegex = /((?:import|export)\s+.*from\s+['"])(\.\.?\/[^'"]+)(['"])|(?:import\(['"])(\.\.?\/[^'"]+)(['"]\))/g;

    content = content.replace(relativeRegex, (match, prefix1, importPath1, suffix1, importPath2, suffix2) => {
        const prefix = prefix1 || 'import("';
        const importPath = importPath1 || importPath2;
        const suffix = suffix1 || suffix2;

        if (!importPath.startsWith('.')) return match;

        // Resolve exactly what file this points to
        const absoluteImportDir = path.resolve(path.dirname(file), importPath);
        // Sometimes it points to a directory assuming /index
        let targetAbsolute = absoluteImportDir;

        let relativeToShared = path.relative(SHARED_DIR, targetAbsolute).replace(/\\/g, '/');
        if (relativeToShared.startsWith('..')) {
            // Not pointing into shared types
            return match;
        }

        let targetKey = relativeToShared;

        if (!mappings[targetKey]) {
            // might be implicitly pointing to index
            if (mappings[`${targetKey}/index`]) {
                targetKey = `${targetKey}/index`;
            }
        }

        if (mappings[targetKey]) {
            const mappedAbsolute = path.resolve(SHARED_DIR, mappings[targetKey]);
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

console.log(`\nPatched ${modifiedCount} files with new shared type imports.`);
