const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(process.cwd(), 'app', 'ui');
const APP_DIR = path.join(process.cwd(), 'app');
const COMPONENTS_DIR = path.join(process.cwd(), 'components');

function toPascalCase(str) {
    if (str.includes('-') || str.includes('_')) {
        return str.split(/[-_]+/).map(part => {
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join('');
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// 1. Rename files in app/ui
const renames = {};
const uiFiles = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.tsx'));

for (let oldFile of uiFiles) {
    const baseName = oldFile.replace('.tsx', '');
    if (baseName.includes('.')) continue; // skip already modified files if script re-runs

    const pascalName = toPascalCase(baseName);
    const newFile = `${pascalName}.primitive.tsx`;
    const oldPath = path.join(UI_DIR, oldFile);
    const newPath = path.join(UI_DIR, newFile);

    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldFile} -> ${newFile}`);

    // Store mappings for import updates (old path stem to new path stem)
    renames[baseName] = `${pascalName}.primitive`;
}

// 2. Scan and update all imports
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

    for (const oldName in renames) {
        const newName = renames[oldName];

        // Match import lines containing the exact UI base name
        const regex1 = new RegExp(`(['"])(.*\\/ui\\/)${oldName}(['"])`, 'g');
        const regex2 = new RegExp(`(['"])(.*\\/ui\\/)${oldName}\\.tsx(['"])`, 'g');

        if (regex1.test(content) || regex2.test(content)) {
            // Reset lastIndex from the `.test()` call since 'g' flag makes it stateful
            regex1.lastIndex = 0;
            regex2.lastIndex = 0;

            content = content.replace(regex1, `$1$2${newName}$3`);
            content = content.replace(regex2, `$1$2${newName}$3`);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log(`Patched references in: ${file.replace(process.cwd(), '')}`);
    }
}

console.log(`\nCompleted renaming ${Object.keys(renames).length} primitive files.`);
console.log(`Patched ${modifiedCount} files with new primitive imports.`);
