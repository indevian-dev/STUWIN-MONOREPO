import * as fs from 'fs';
import * as path from 'path';

const DOMAIN_DIR = path.join(process.cwd(), 'lib/domain');

// Get all the newly created .index.ts files
function getIndexFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getIndexFiles(fullPath));
        } else if (file.endsWith('.index.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

const indexes = getIndexFiles(DOMAIN_DIR);
const mappings: { dir: string, file: string }[] = [];

for (const file of indexes) {
    const dirname = path.basename(path.dirname(file));
    const filename = path.basename(file).replace('.ts', '');

    mappings.push({
        dir: dirname,
        file: filename
    });
}

function processFile(fullPath: string) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // We only care about `@/lib/domain/Auth` or `../../domain/Auth` imports
    // so we rewrite them to `@/lib/domain/auth/Auth.index`

    // Pattern 1: domain/auth or domain/auth/index
    for (const map of mappings) {
        // Find strings matching `domain/auth` or `domain/auth/index` inside quotes
        const regex1 = new RegExp(`(['"])(.*?)domain\\/${map.dir}(['"])`, 'g');
        if (regex1.test(content)) {
            content = content.replace(regex1, `$1$2domain/${map.dir}/${map.file}$3`);
            changed = true;
        }

        const regex2 = new RegExp(`(['"])(.*?)domain\\/${map.dir}\\/index(?:\\.ts)?(['"])`, 'g');
        if (regex2.test(content)) {
            content = content.replace(regex2, `$1$2domain/${map.dir}/${map.file}$3`);
            changed = true;
        }
    }

    // Pattern 2: the root domain folder import itself `@/lib/domain` -> `@/lib/domain/Domain.index`
    const rootRegex1 = /(['"])(@\/lib\/domain)(['"])/g;
    if (rootRegex1.test(content)) {
        content = content.replace(rootRegex1, '$1$2/Domain.index$3');
        changed = true;
    }
    const rootRegex2 = /(['"])(@\/lib\/domain\/index)(['"])/g;
    if (rootRegex2.test(content)) {
        content = content.replace(rootRegex2, '$1@/lib/domain/Domain.index$3');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated index imports in:', fullPath);
    }
}

function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fullPath.includes('node_modules') || fullPath.includes('.next') || fullPath.includes('.git')) continue;
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                processFile(fullPath);
            }
        }
    } catch (e) { }
}

scanDir(path.join(process.cwd(), 'app'));
scanDir(path.join(process.cwd(), 'lib'));
scanDir(path.join(process.cwd(), 'components'));
