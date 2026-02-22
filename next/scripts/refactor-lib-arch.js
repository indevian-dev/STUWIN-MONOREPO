const fs = require('fs');
const path = require('path');

const NEXT_DIR = process.cwd();
const DIRS_TO_PROCESS = [
    path.join(NEXT_DIR, 'lib', 'middleware'),
    path.join(NEXT_DIR, 'lib', 'logging'),
    path.join(NEXT_DIR, 'lib', 'routes')
];
const DIRS_TO_PATCH = [
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

const filesToProcess = DIRS_TO_PROCESS.flatMap(d => walk(d));
const mappings = {};

for (const oldPath of filesToProcess) {
    const ext = path.extname(oldPath);
    if (ext !== '.ts' && ext !== '.tsx') continue;

    const relToNext = path.relative(NEXT_DIR, oldPath).replace(/\\/g, '/');
    const dir = path.dirname(oldPath);
    const baseName = path.basename(oldPath, ext);

    // Skip already refactored files like ApiResponse.type.ts
    if (baseName.includes('.')) {
        if (baseName !== 'index') continue;
    }

    let newBaseName;

    if (baseName === 'index') {
        const folderName = path.basename(dir);
        newBaseName = `${toPascalCase(folderName)}.index`;
    } else {
        const componentName = toPascalCase(baseName);

        if (relToNext.includes('lib/middleware')) {
            newBaseName = `${componentName}.middleware`;
        } else if (relToNext.includes('lib/logging')) {
            newBaseName = `${componentName}.logger`;
        } else if (relToNext.includes('lib/routes')) {
            if (componentName === 'Types' || componentName === 'ApiTypes') {
                newBaseName = `${componentName}.type`;
            } else {
                newBaseName = `${componentName}.route`;
            }
        }
    }

    const newPath = path.join(dir, `${newBaseName}${ext}`);

    if (oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${relToNext} -> ${path.relative(NEXT_DIR, newPath).replace(/\\/g, '/')}`);

        let oldImportKey = relToNext.replace(/\.tsx?$/, '');
        let newImportKey = path.relative(NEXT_DIR, newPath).replace(/\\/g, '/').replace(/\.tsx?$/, '');

        // Strip leading 'lib/' so it matches absolute `@/lib/...` imports easier
        oldImportKey = oldImportKey.replace(/^lib\//, '');
        newImportKey = newImportKey.replace(/^lib\//, '');

        mappings[oldImportKey] = newImportKey;
    }
}

console.log('\nMappings built:', Object.keys(mappings).length);

let modifiedCount = 0;
const allFilesToPatch = DIRS_TO_PATCH.flatMap(d => walk(d));

for (const file of allFilesToPatch) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Replace absolute imports @/lib/middleware/... 
    const absoluteRegex = /(['"])@\/lib\/([^'"]+)(['"])/g;
    content = content.replace(absoluteRegex, (match, prefix, importPath, suffix) => {
        importPath = importPath.replace(/\.ts$/, '');

        if (mappings[importPath]) {
            changed = true;
            return `${prefix}@/lib/${mappings[importPath]}${suffix}`;
        }

        // Handle implicit indexes
        if (mappings[importPath + '/index']) {
            changed = true;
            return `${prefix}@/lib/${mappings[importPath + '/index']}${suffix}`;
        }
        return match;
    });

    // 2. Replace relative imports
    const relativeRegex = /((?:import|export)\s+.*from\s+['"])(\.\.?\/[^'"]+)(['"])|(?:import\(['"])(\.\.?\/[^'"]+)(['"]\))/g;
    content = content.replace(relativeRegex, (match, prefix1, importPath1, suffix1, importPath2, suffix2) => {
        const prefix = prefix1 || 'import("';
        const importPath = importPath1 || importPath2;
        const suffix = suffix1 || suffix2;

        if (!importPath.startsWith('.')) return match;

        const absoluteImportDir = path.resolve(path.dirname(file), importPath);
        const relativeToLib = path.relative(path.join(NEXT_DIR, 'lib'), absoluteImportDir).replace(/\\/g, '/');

        if (relativeToLib.startsWith('..')) return match;

        let targetKey = relativeToLib;

        if (!mappings[targetKey] && mappings[targetKey + '/index']) {
            targetKey = targetKey + '/index';
        }

        if (mappings[targetKey]) {
            const mappedAbsolute = path.resolve(path.join(NEXT_DIR, 'lib'), mappings[targetKey]);
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
        console.log(`Patched references in: ${path.relative(NEXT_DIR, file)}`);
    }
}

console.log(`\nPatched ${modifiedCount} files with updated lib architectural imports.`);
