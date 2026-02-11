/**
 * Script: Update auth service imports from infra/notifications to domain/notification
 */
const fs = require('fs');
const path = require('path');

const authDir = path.join(__dirname, '..', 'next', 'lib', 'domain', 'auth');

const replacements = [
    // mailGenerator imports → mail.templates
    {
        from: /from\s+['"]@\/lib\/infra\/notifications\/mail\/mailGenerator['"]/g,
        to: 'from "@/lib/domain/notification/mail.templates"'
    },
    // smsGenerator imports → sms.templates
    {
        from: /from\s+['"]@\/lib\/infra\/notifications\/sms\/smsGenerator['"]/g,
        to: 'from "@/lib/domain/notification/sms.templates"'
    },
];

const files = fs.readdirSync(authDir)
    .filter(f => f.endsWith('.ts'))
    .map(f => path.join(authDir, f));

let totalChanges = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const original = content;

    for (const r of replacements) {
        content = content.replace(r.from, r.to);
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf-8');
        totalChanges++;
        console.log(`✓ Updated: ${path.basename(file)}`);
    }
}

console.log(`\nDone! Updated ${totalChanges} files.`);
