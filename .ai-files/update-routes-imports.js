/**
 * Script: Mass update imports for routes/types merge
 * infra/types/endpoints → routes/types
 * infra/types/handlers → routes/types
 * infra/types/server → routes/api.types
 * infra/contracts/handlers → routes/helpers
 * EmailTemplate/SMSTemplate → domain/notification
 */
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', 'next');

function findFiles(dir, exts = ['.ts', '.tsx']) {
    const results = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.next') {
                results.push(...findFiles(fullPath, exts));
            } else if (exts.some(ext => entry.name.endsWith(ext))) {
                results.push(fullPath);
            }
        }
    } catch (e) { }
    return results;
}

const files = findFiles(nextDir);
let totalChanges = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;

    // 1. Notification Templates (must come before server check)
    if (content.includes('EmailTemplate') || content.includes('SMSTemplate')) {
        content = content.replace(
            /import.*(?:EmailTemplate|SMSTemplate).*from ['"]@\/lib\/infra\/types\/server['"];?/g,
            (match) => match.replace('@/lib/infra/types/server', '@/lib/domain/notification')
        );
    }

    // 2. Contracts/Handlers → routes/helpers
    content = content.replace(/@\/lib\/infra\/contracts\/handlers/g, '@/lib/routes/helpers');

    // 3. Types/Endpoints + Types/Handlers → routes/types
    content = content.replace(/@\/lib\/infra\/types\/endpoints/g, '@/lib/routes/types');
    content = content.replace(/@\/lib\/infra\/types\/handlers/g, '@/lib/routes/types');

    // 4. Types/Server → routes/api.types
    content = content.replace(/@\/lib\/infra\/types\/server/g, '@/lib/routes/api.types');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        totalChanges++;
        const rel = path.relative(nextDir, file);
        console.log(`✓ ${rel}`);
    }
}

console.log(`\nDone! Updated ${totalChanges} files for routes/types imports.`);
