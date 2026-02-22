import { readdirSync, lstatSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';

const DRY_RUN = false;
const DOMAIN_DIR = join(process.cwd(), 'lib/domain');
const TARGET_DIRS = ['app', 'lib', 'components', 'scripts'];

function toPascalCase(str: string): string {
    if (str.includes('-') || str.includes('_')) {
        return str.split(/[-_]+/).map(part => {
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join('');
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const renames: { oldPath: string, newPath: string, folderName: string, newNamedImport: string }[] = [];

// 1. Find all index.ts files in domain
function scanForIndex(dir: string) {
    if (!existsSync(dir)) return;
    const files = readdirSync(dir);
    for (const file of files) {
        const fullPath = join(dir, file);
        const stat = lstatSync(fullPath);

        if (stat.isDirectory()) {
            scanForIndex(fullPath);
        } else if (file === 'index.ts') {
            const folderName = basename(dir);
            // Skip the root lib/domain/index.ts usually because it might be the factory export
            // BUT user specifically had 'next\lib\domain\index.ts' open. Let's rename even the root.
            const pascalFolder = folderName === 'domain' ? 'Domain' : toPascalCase(folderName);
            const newName = `${pascalFolder}.index.ts`;
            const newPath = join(dir, newName);

            renames.push({
                oldPath: fullPath,
                newPath: newPath,
                folderName: folderName,
                newNamedImport: `${pascalFolder}.index`
            });
        }
    }
}

scanForIndex(DOMAIN_DIR);

if (DRY_RUN) {
    console.log("Planned renames:\n", renames);
    process.exit(0);
}

// 2. Execute git mv
for (const op of renames) {
    try {
        console.log(`Renaming: ${op.oldPath} -> ${op.newPath}`);
        execSync(`git mv "${op.oldPath}" "${op.newPath}"`, { stdio: 'inherit' });
    } catch (e) {
        console.log("Git move failed, attempting regular filesystem move...");
        execSync(`mv "${op.oldPath}" "${op.newPath}"`, { stdio: 'inherit' });
    }
}

// 3. Update all imports across the codebase
function processFileForImports(fullPath: string) {
    let content = readFileSync(fullPath, 'utf8');
    let changed = false;

    // We need to catch statements like:
    // import { AuthService } from '@/lib/domain/auth';
    // export * from './auth';

    for (const op of renames) {
        // e.g. domain/auth
        const relativeDomainPath = op.oldPath.split('lib/domain/')[1].replace(/\\/g, '/').replace('/index.ts', '');

        // Pattern 1: Explicit import from the folder without index.ts
        // regex matches '@/lib/domain/auth' or `'./auth'`
        const regex1 = new RegExp(`([\'\"])(@/lib/domain/|\\./|\\.\\./)+(${relativeDomainPath})([\'\"])`, 'g');
        if (regex1.test(content)) {
            content = content.replace(regex1, `$1$2$3/${op.newNamedImport}$4`);
            changed = true;
        }

        // Pattern 2: Explicit import from index or index.ts
        const regex2 = new RegExp(`([\'\"])(@/lib/domain/|\\./|\\.\\./)+(${relativeDomainPath})/index(?:\\.ts)?([\'\"])`, 'g');
        if (regex2.test(content)) {
            content = content.replace(regex2, `$1$2$3/${op.newNamedImport}$4`);
            changed = true;
        }

        // Pattern 3: Root domain imports
        if (op.folderName === 'domain') {
            const regex3 = /(['"])(@\/lib\/domain)(['"])/g;
            if (regex3.test(content)) {
                content = content.replace(regex3, `$1$2/Domain.index$3`);
                changed = true;
            }
            const regex4 = /(['"])(@\/lib\/domain\/index)(['"])/g;
            if (regex4.test(content)) {
                content = content.replace(regex4, `$1@/lib/domain/Domain.index$3`);
                changed = true;
            }
        }
    }

    if (changed) {
        writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in: ${fullPath}`);
    }
}

function scanDirForUpdates(dir: string) {
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            const fullPath = join(dir, file);
            if (fullPath.includes('node_modules') || fullPath.includes('.next') || fullPath.includes('.git') || fullPath.includes('.gemini')) {
                continue;
            }
            const stat = lstatSync(fullPath);
            if (stat.isDirectory()) {
                scanDirForUpdates(fullPath);
            } else if (stat.isFile() && fullPath.match(/\.(ts|tsx)$/)) {
                processFileForImports(fullPath);
            }
        }
    } catch (e) { }
}

TARGET_DIRS.forEach(dir => scanDirForUpdates(join(process.cwd(), dir)));
console.log("Domain index files rename complete!");
