const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(process.cwd(), 'app', 'ui');
const PRIMITIVES_DIR = path.join(process.cwd(), 'app', 'primitives');
const APP_DIR = path.join(process.cwd(), 'app');
const COMPONENTS_DIR = path.join(process.cwd(), 'components');

if (fs.existsSync(UI_DIR)) {
    fs.renameSync(UI_DIR, PRIMITIVES_DIR);
    console.log('Renamed app/ui to app/primitives');
} else {
    console.log('app/ui does not exist, moving to patch step just in case...');
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

const allFiles = [...walk(APP_DIR)];
if (fs.existsSync(COMPONENTS_DIR)) {
    allFiles.push(...walk(COMPONENTS_DIR));
}

let modifiedCount = 0;

for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fast check: does it even contain 'ui/'?
    if (!content.includes('ui/')) continue;

    // Match exactly /ui/ ComponentName.primitive and optionally .tsx
    const regex = /(['"])(.*\/)ui(\/[A-Z][a-zA-Z0-9_\-]+\.primitive)(['"])/g;

    if (regex.test(content)) {
        regex.lastIndex = 0;
        content = content.replace(regex, `$1$2primitives$3$4`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log(`Patched folder references in: ${file.replace(process.cwd(), '')}`);
    }
}

console.log(`\nPatched ${modifiedCount} files with new 'primitives' folder imports.`);
