import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { execSync } from 'child_process';

const DRY_RUN = false; // ACTUALLY EXECUTE
const TARGET_DIRS = ['app', 'lib', 'components', 'hooks'];

interface RenameOp {
    oldPath: string;
    newPath: string;
    oldImportBase: string;
    newImportBase: string;
}

const renames: RenameOp[] = [];

// Helper to convert kebab-case to PascalCase, BUT preserves existing PascalCase / camelCase
function toPascalCase(str: string): string {
    if (str.includes('-') || str.includes('_')) {
        return str.split(/[-_]+/).map(part => {
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join('');
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function scanDir(dir: string) {
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            const fullPath = join(dir, file);

            if (fullPath.includes('node_modules') || fullPath.includes('.next') || fullPath.includes('.git') || fullPath.includes('.gemini')) {
                continue;
            }

            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (stat.isFile()) {
                processFile(fullPath, file);
            }
        }
    } catch (e) {
        // Ignore
    }
}

function processFile(fullPath: string, fileName: string) {
    let newName = fileName;
    const ext = extname(fileName);
    const base = basename(fileName, ext);

    if (!ext.match(/^\.tsx?$/)) return;

    if (base.endsWith('.service')) {
        const namePart = base.replace('.service', '');
        newName = `${toPascalCase(namePart)}.service${ext}`;
    } else if (base.endsWith('.repository')) {
        const namePart = base.replace('.repository', '');
        newName = `${toPascalCase(namePart)}.repository${ext}`;
    } else if (base.endsWith('.types')) {
        const namePart = base.replace('.types', '');
        newName = `${toPascalCase(namePart)}.types${ext}`;
    } else if (base.endsWith('.inputs')) {
        const namePart = base.replace('.inputs', '');
        newName = `${toPascalCase(namePart)}.inputs${ext}`;
    } else if (base.endsWith('Widget')) {
        const namePart = base.replace('Widget', '');
        newName = `${toPascalCase(namePart)}.widget${ext}`;
    } else if (base.endsWith('Tile')) {
        const namePart = base.replace('Tile', '');
        newName = `${toPascalCase(namePart)}.tile${ext}`;
    } else if (base.endsWith('Modal')) {
        const namePart = base.replace('Modal', '');
        newName = `${toPascalCase(namePart)}.modal${ext}`;
    } else if (base.endsWith('Utility') || base.endsWith('Util')) {
        const namePart = base.replace(/Utility$/, '').replace(/Util$/, '');
        newName = `${toPascalCase(namePart)}.util${ext}`;
    } else if (base.endsWith('Response') && fullPath.replace(/\\/g, '/').includes('/responses/')) {
        const namePart = base.replace('Response', '');
        newName = `${toPascalCase(namePart)}Response.type${ext}`;
    }

    if (newName !== fileName) {
        renames.push({
            oldPath: fullPath.replace(/\\/g, '/'),
            newPath: join(dirname(fullPath), newName).replace(/\\/g, '/'),
            oldImportBase: base,
            newImportBase: basename(newName, ext)
        });
    }
}

// Second pass: Update imports in files
function updateImports(dir: string, renames: RenameOp[]) {
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            const fullPath = join(dir, file);

            if (fullPath.includes('node_modules') || fullPath.includes('.next') || fullPath.includes('.git') || fullPath.includes('.gemini')) {
                continue;
            }

            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                updateImports(fullPath, renames);
            } else if (stat.isFile() && fullPath.match(/\.tsx?$/)) {
                let content = readFileSync(fullPath, 'utf8');
                let changed = false;

                // Replace imports matching the EXACT old base name with the EXACT new base name
                // To avoid partial matches like "auth" matching inside "authorisation", we ensure it's
                // bounded by either word boundary or slash, and quote marks for imports.

                for (const op of renames) {
                    // This regex looks for imports/exports containing the old base name
                    // e.g. from './auth.service' or import ... from '@/lib/.../auth.service'
                    // We escape literal dots in target paths
                    const escapedOldBase = op.oldImportBase.replace(/\./g, '\\.');

                    // Regex explained: matches / or ' or " followed by old base name, followed by ' or "
                    const regex = new RegExp(`([/\\'"])${escapedOldBase}(['"])`, 'g');

                    if (regex.test(content)) {
                        content = content.replace(regex, `$1${op.newImportBase}$2`);
                        changed = true;
                    }
                }

                if (changed) {
                    writeFileSync(fullPath, content, 'utf8');
                    console.log(`Updated imports in: ${fullPath}`);
                }
            }
        }
    } catch (e) {
        // Ignore
    }
}

function main() {
    console.log("Stage 1: Scanning directories for files to rename...");
    for (const dir of TARGET_DIRS) {
        scanDir(dir);
    }

    if (renames.length === 0) {
        console.log("No files needed renaming.");
        return;
    }

    if (DRY_RUN) {
        console.log(`[DRY RUN] Would rename ${renames.length} files.`);
        return;
    }

    console.log(`Stage 2: Renaming ${renames.length} files via git...`);
    for (const op of renames) {
        try {
            // Using git mv ensures Windows case-only changes are tracked properly
            execSync(`git mv "${op.oldPath}" "${op.newPath}"`, { stdio: 'ignore' });
            console.log(`Renamed: ${op.oldPath} -> ${op.newPath}`);
        } catch (err) {
            console.error(`Failed to rename ${op.oldPath}. Ensure it is tracked in git. Switching to standard fs.rename...`);
            try {
                execSync(`mv "${op.oldPath}" "${op.newPath}"`, { stdio: 'ignore' });
            } catch (e) { }
        }
    }

    console.log("\nStage 3: Updating import paths across the codebase...");
    for (const dir of TARGET_DIRS) {
        updateImports(dir, renames);
    }

    console.log("\nCompleted refactoring!");
}

main();
