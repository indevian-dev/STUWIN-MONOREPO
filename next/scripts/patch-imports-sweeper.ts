import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function processFile(fullPath: string) {
    let content = readFileSync(fullPath, 'utf8');
    let changed = false;

    // Pattern 1: Catch Widget imports that were left untouched
    const widgetRegex = /from (['"])(.*?)Widget(['"])/g;
    if (widgetRegex.test(content)) {
        content = content.replace(widgetRegex, "from $1$2.widget$3");
        changed = true;
    }

    // Pattern 2: Catch Tile imports
    const tileRegex = /from (['"])(.*?)Tile(['"])/g;
    if (tileRegex.test(content)) {
        content = content.replace(tileRegex, "from $1$2.tile$3");
        changed = true;
    }

    // Pattern 3: Catch Modal imports
    const modalRegex = /from (['"])(.*?)Modal(['"])/g;
    if (modalRegex.test(content)) {
        content = content.replace(modalRegex, "from $1$2.modal$3");
        changed = true;
    }

    if (changed) {
        writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in: ${fullPath}`);
    }
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
            } else if (stat.isFile() && fullPath.match(/\.tsx?$/)) {
                processFile(fullPath);
            }
        }
    } catch (e) {
        // Ignore
    }
}

console.log("Stage 4: Sweeping strictly for Widget/Tile/Modal missed suffixes...");
['app', 'lib', 'components'].forEach(scanDir);
