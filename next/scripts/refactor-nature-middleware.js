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

// Explicit mappings for the nature-first architecture
const fileMap = {
    'ApiErrorMapper.middleware.ts': 'Mapper.ApiError.middleware.ts',
    'ApiInterceptor.middleware.ts': 'Interceptor.Api.middleware.ts',
    'CookieAuthenticator.middleware.ts': 'Authenticator.Cookie.middleware.ts',
    'CoreAuthorizer.middleware.ts': 'Authorizer.Core.middleware.ts',
    'OAuthAuthenticator.middleware.ts': 'Authenticator.OAuth.middleware.ts',
    'Responder.middleware.ts': 'Responder.Api.middleware.ts',
    'RouteValidator.middleware.ts': 'Validator.Route.middleware.ts',
    'SessionStore.middleware.ts': 'Store.Session.middleware.ts',
    'ViewInterceptor.middleware.tsx': 'Interceptor.View.middleware.tsx',
    // also standardizing the type just in case
    'ApiResponse.type.ts': 'Response.Api.type.ts'
};

const baseMappings = {};

// 1. Rename the files on disk
console.log('--- RENAMING FILES ---');
for (const [oldName, newName] of Object.entries(fileMap)) {
    const oldPath = path.join(MIDDLEWARE_DIR, oldName);
    const newPath = path.join(MIDDLEWARE_DIR, newName);

    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${oldName} -> ${newName}`);

        // build base mappings (without extension) for import replacement
        const oldBase = oldName.replace(/\.tsx?$/, '');
        const newBase = newName.replace(/\.tsx?$/, '');
        baseMappings[oldBase] = newBase;
    }
}

// 2. Rebuild Middleware.index.ts
console.log('\n--- REBUILDING INDEX ---');
const indexFile = path.join(MIDDLEWARE_DIR, 'Middleware.index.ts');
if (fs.existsSync(indexFile)) {
    const existingFiles = fs.readdirSync(MIDDLEWARE_DIR)
        .filter(f => f !== 'Middleware.index.ts' && (f.endsWith('.ts') || f.endsWith('.tsx')));

    const exportsText = existingFiles.map(file => {
        const baseName = file.replace(/\.tsx?$/, '');
        return `export * from './${baseName}';`;
    }).join('\n');

    fs.writeFileSync(indexFile, exportsText + '\n');
    console.log('Rebuilt Middleware.index.ts successfully.');
}

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

// 3. Patch imports globally
console.log('\n--- PATCHING IMPORTS ---');
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

    // Fast check
    if (!content.includes('middleware') && !content.includes('ApiInterceptor') && !content.includes('CookieAuthenticator') && !content.includes('SessionStore') && !content.includes('CoreAuthorizer') && !content.includes('OAuthAuthenticator')) {
        continue;
    }

    for (const [oldBase, newBase] of Object.entries(baseMappings)) {
        // Replace absolute imports: @/lib/middleware/ApiInterceptor.middleware
        const absRegex = new RegExp(`(['"])@\\/lib\\/middleware\\/${oldBase.replace(/\./g, '\\.')}(['"])`, 'g');
        if (absRegex.test(content)) {
            absRegex.lastIndex = 0;
            content = content.replace(absRegex, `$1@/lib/middleware/${newBase}$2`);
            changed = true;
        }

        // Replace relative imports ending with the exact oldBase: e.g. ../middleware/ApiInterceptor.middleware
        const relRegex = new RegExp(`(['"])((?:\\.\\.\\/)+)lib\\/middleware\\/${oldBase.replace(/\./g, '\\.')}(['"])`, 'g');
        if (relRegex.test(content)) {
            relRegex.lastIndex = 0;
            content = content.replace(relRegex, `$1$2lib/middleware/${newBase}$3`);
            changed = true;
        }

        const shortRelRegex = new RegExp(`(['"])((?:\\.\\.\\/)+)middleware\\/${oldBase.replace(/\./g, '\\.')}(['"])`, 'g');
        if (shortRelRegex.test(content)) {
            shortRelRegex.lastIndex = 0;
            content = content.replace(shortRelRegex, `$1$2middleware/${newBase}$3`);
            changed = true;
        }
        const siblingRelRegex = new RegExp(`(['"])\\.\\/${oldBase.replace(/\./g, '\\.')}(['"])`, 'g');
        if (siblingRelRegex.test(content)) {
            siblingRelRegex.lastIndex = 0;
            content = content.replace(siblingRelRegex, `$1./${newBase}$2`);
            changed = true;
        }

    }

    if (changed) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log(`Patched references in: ${path.relative(NEXT_DIR, file)}`);
    }
}

console.log(`\nCompleted Nature-First refactoring. Patched imports in ${modifiedCount} files.`);
