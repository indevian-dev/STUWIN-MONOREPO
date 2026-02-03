const fs = require('fs');
const path = require('path');

const TARGET_DIR = "c:\\Users\\indev\\OneDrive\\Desktop\\DEVELOPMENT\\PROJECTS\\STUWIN-MONOREPO\\stuwin-monorepo\\frameworks\\next\\app\\[locale]";
const LOADER_IMPORT = "import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';";

const LOADING_VARS = '(?:loading|isLoading|isFetching|isSaving|fetching)';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Match early returns: if (loading) return ( <div...animate-spin...</div> );
    const earlyReturnRegex = new RegExp(`if\\s*\\(${LOADING_VARS}\\)\\s*{\\s*return\\s*\\(\\s*<div[^>]*>[\\s\\S]*?(?:animate-spin|PiSpinner)[\\s\\S]*?<\\/div>\\s*\\);?\\s*\\}`, 'g');
    if (earlyReturnRegex.test(content)) {
        content = content.replace(earlyReturnRegex, (match) => {
            const h3Match = match.match(/<h3[^>]*>([^<]+)<\/h3>/);
            const pMatch = match.match(/<p[^>]*>([^<]+)<\/p>/);
            const spanMatch = match.match(/<span[^>]*>([^<]+)<\/span>/);
            const textMatch = match.match(/>([^<]{5,})<\//);
            const varMatch = match.match(new RegExp(`if\\s*\\((${LOADING_VARS})\\)`));
            const varName = varMatch ? varMatch[1] : 'loading';

            let message = h3Match ? h3Match[1].trim() : (spanMatch ? spanMatch[1].trim() : (pMatch ? pMatch[1].trim() : (textMatch ? textMatch[1].trim() : null)));

            if (message && (message.toLowerCase().includes('animate-spin') || message.includes('{'))) message = null;

            return message
                ? `if (${varName}) return <GlobalLoaderTile message="${message}" />;`
                : `if (${varName}) return <GlobalLoaderTile />;`;
        });
        changed = true;
    }

    // 2. Match early returns without braces: if (loading) return <div...animate-spin...</div>;
    const earlyReturnNoBracesRegex = new RegExp(`if\\s*\\(${LOADING_VARS}\\)\\s*return\\s*\\(\\s*<div[^>]*>[\\s\\S]*?(?:animate-spin|PiSpinner)[\\s\\S]*?<\\/div>\\s*\\);?`, 'g');
    if (earlyReturnNoBracesRegex.test(content)) {
        content = content.replace(earlyReturnNoBracesRegex, (match) => {
            const varMatch = match.match(new RegExp(`if\\s*\\((${LOADING_VARS})\\)`));
            const varName = varMatch ? varMatch[1] : 'loading';
            return `if (${varName}) return <GlobalLoaderTile />;`;
        });
        changed = true;
    }

    // 3. Match logical AND: {loading && <div...animate-spin...</div>}
    const logicalAndRegex = new RegExp(`\\{(?:${LOADING_VARS})\\s+&&\\s+\\(?\\s*<div[^>]*>[\\s\\S]*?(?:animate-spin|PiSpinner)[\\s\\S]*?<\\/div>\\s*\\)?\\}`, 'g');
    if (logicalAndRegex.test(content)) {
        content = content.replace(logicalAndRegex, (match) => {
            const spanMatch = match.match(/<span[^>]*>([^<]+)<\/span>/);
            const divTextMatch = match.match(/>([^<]{5,})<\//);
            const varMatch = match.match(new RegExp(`(${LOADING_VARS})\\s+&&`));
            const varName = varMatch ? varMatch[1] : 'loading';

            let message = spanMatch ? spanMatch[1].trim() : (divTextMatch ? divTextMatch[1].trim() : null);

            if (message && message.includes('{')) message = null;

            return message
                ? `{${varName} && <GlobalLoaderTile message="${message}" />}`
                : `{${varName} && <GlobalLoaderTile />}`;
        });
        changed = true;
    }

    // 4. Match ternary: {loading ? <div...animate-spin...</div> : <div>...</div>}
    const ternaryRegex = new RegExp(`\\{(${LOADING_VARS})\\s*\\?\\s*\\(\\s*<div[^>]*>[\\s\\S]*?(?:animate-spin|PiSpinner)[\\s\\S]*?<\\/div>\\s*\\)\\s*:\\s*`, 'g');
    if (ternaryRegex.test(content)) {
        content = content.replace(ternaryRegex, (match, varName) => {
            const spanMatch = match.match(/<span[^>]*>([^<]+)<\/span>/);
            const divTextMatch = match.match(/>([^<]{5,})<\//);
            let message = spanMatch ? spanMatch[1].trim() : (divTextMatch ? divTextMatch[1].trim() : null);

            if (message && message.includes('{')) message = null;

            return message
                ? `{${varName} ? <GlobalLoaderTile message="${message}" /> : `
                : `{${varName} ? <GlobalLoaderTile /> : `;
        });
        changed = true;
    }

    // Add import if not present and something changed
    if (changed) {
        if (!content.includes('GlobalLoaderTile')) {
            const lastImportIndex = content.lastIndexOf('import');
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf(';', lastImportIndex);
                if (endOfLastImport !== -1) {
                    content = content.slice(0, endOfLastImport + 1) + '\n' + LOADER_IMPORT + content.slice(endOfLastImport + 1);
                }
            }
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

console.log(`Starting loader refactoring in ${TARGET_DIR}...`);
walkDir(TARGET_DIR);
console.log('Refactoring complete.');
