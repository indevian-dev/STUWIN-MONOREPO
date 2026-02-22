const fs = require('fs');
const path = require('path');

const NEXT_DIR = process.cwd();
const MIDDLEWARE_DIR = path.join(NEXT_DIR, 'lib', 'middleware');
const DIRS_TO_PATCH = [
    path.join(NEXT_DIR, 'app'),
    path.join(NEXT_DIR, 'components'),
    path.join(NEXT_DIR, 'lib'),
    path.join(NEXT_DIR, 'scripts'),
    path.join(NEXT_DIR, 'proxy.ts')
];

// Helper to find all files recursively
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

const middlewareFiles = walk(MIDDLEWARE_DIR);
const mappings = {};

// 1. Move files out of subfolders
for (const oldPath of middlewareFiles) {
    const ext = path.extname(oldPath);
    if (ext !== '.ts' && ext !== '.tsx') continue;

    // Relative to `lib/middleware`
    const relToMiddleware = path.relative(MIDDLEWARE_DIR, oldPath);
    const dirName = path.dirname(relToMiddleware);
    const baseName = path.basename(relToMiddleware); // includes extension
    const baseNameNoExt = path.basename(relToMiddleware, ext);

    // If it's already in the root, it's fine (e.g. Middleware.index.ts)
    if (dirName === '.') {
        continue;
    }

    // If it's a nested index file (e.g., Authenticators.index.ts), DELETE IT
    if (baseNameNoExt.endsWith('.index')) {
        fs.unlinkSync(oldPath);
        console.log(`Deleted nested index file: ${relToMiddleware}`);

        // Map the old nested folder reference to the new root index reference
        const oldImportPathFromLib = path.join('middleware', dirName).replace(/\\/g, '/');
        const oldImportPathIndex = path.join('middleware', dirName, baseNameNoExt).replace(/\\/g, '/');
        const newImportPath = 'middleware/Middleware.index';

        mappings[oldImportPathFromLib] = newImportPath;
        mappings[oldImportPathIndex] = newImportPath;
        continue;
    }

    // Move standard files to the root of `lib/middleware`
    const newPath = path.join(MIDDLEWARE_DIR, baseName);
    fs.renameSync(oldPath, newPath);
    console.log(`Moved: ${relToMiddleware} -> ${baseName}`);

    const oldImportPath = path.join('middleware', dirName, baseNameNoExt).replace(/\\/g, '/');
    const newImportPath = path.join('middleware', baseNameNoExt).replace(/\\/g, '/');

    mappings[oldImportPath] = newImportPath;
}

// 2. Clean up empty directories
const subFolders = ['authenticators', 'authorizers', 'handlers', 'responses', 'validators'];
for (const folder of subFolders) {
    const folderPath = path.join(MIDDLEWARE_DIR, folder);
    if (fs.existsSync(folderPath)) {
        // Double check no straggler files somehow remain
        const remaining = fs.readdirSync(folderPath);
        if (remaining.length === 0) {
            fs.rmdirSync(folderPath);
            console.log(`Deleted empty directory: lib/middleware/${folder}`);
        } else {
            console.warn(`Could not delete lib/middleware/${folder}, found remaining files:`, remaining);
        }
    }
}

// Rebuild the main Middleware.index.ts barrel file to ensure it exports the moved items correctly
const finalMiddlewareFiles = walk(MIDDLEWARE_DIR).filter(f => f !== path.join(MIDDLEWARE_DIR, 'Middleware.index.ts'));
const exportsText = finalMiddlewareFiles.map(file => {
    const baseName = path.basename(file, path.extname(file));
    return `export * from './${baseName}';`;
}).join('\n');

fs.writeFileSync(path.join(MIDDLEWARE_DIR, 'Middleware.index.ts'), exportsText + '\n');
console.log('Rebuilt lib/middleware/Middleware.index.ts');

console.log('\nMappings to apply:', mappings);

// 3. Patch imports globally
let modifiedCount = 0;
const allFilesToPatch = [];
for (const dir of DIRS_TO_PATCH) {
    if (fs.existsSync(dir)) {
        if (fs.statSync(dir).isDirectory()) {
            allFilesToPatch.push(...walk(dir));
        } else {
            allFilesToPatch.push(dir); // For solitary proxy.ts file
        }
    }
}

for (const file of allFilesToPatch) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Absolute imports: `@/lib/middleware/...`
    const absoluteRegex = /(['"])@\/lib\/([^'"]+)(['"])/g;
    content = content.replace(absoluteRegex, (match, prefix, importPath, suffix) => {
        importPath = importPath.replace(/\.tsx?$/, '');

        if (mappings[importPath]) {
            changed = true;
            return `${prefix}@/lib/${mappings[importPath]}${suffix}`;
        }
        return match;
    });

    // 2. Relative imports going back to `lib/middleware/...`
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

console.log(`\nPatched ${modifiedCount} files with updated flattened middleware structure.`);
