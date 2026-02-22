import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TARGET_DIRS = ['app', 'lib', 'components', 'hooks', 'scripts'];

// List of base names that were renamed but their imports were missed
const fixes = {
    'PdfUtil': 'Pdf.util',
    'SlimUlidUtil': 'SlimUlid.util',
    'SsrApiUtility': 'SsrApi.util',
    'ApiResponse': 'ApiResponse.type',
    'SpaApiUtility': 'SpaApi.util',
    'TimeFormattingUtil': 'TimeFormatting.util',
    'SectionTitle': 'SectionTitle.widget',
    'section-title': 'SectionTitle.widget', // Note: Case change here
    'semantic-mastery.service': 'SemanticMastery.service',
    'S3Util': 'S3.util',
    'PhoneFormatterUtil': 'PhoneFormatter.util',
    'FinValidatorUtil': 'FinValidator.util',
    'CaseConversionUtil': 'CaseConversion.util',
    'PathNormalizerUtil': 'PathNormalizer.util',
    'GlobalThemeSwitcherWidget': 'GlobalThemeSwitcher.widget'
};

function processFile(fullPath: string) {
    let content = readFileSync(fullPath, 'utf8');
    let changed = false;

    // Check every key in fixes
    for (const [oldBase, newBase] of Object.entries(fixes)) {
        // Regex to find imports/exports of the exact old base name
        // e.g., match `from './Pdf.util'` or `import('@/lib/Pdf.util')`
        // We look for a quote mark, then any path characters, then the old base name, then an optional extension, then a quote mark.

        // This is tricky because we don't want to replace "PdfUtility" if we are searching for "PdfUtil".
        // We make sure it's followed immediately by a quote, or by an extension then a quote.

        const escapedOldBase = oldBase.replace(/\./g, '\\.');
        const regex = new RegExp(`(['"])([\\w\\/\\.\\-@]*\\/)${escapedOldBase}(?:\\.tsx?|\\.ts)?(['"])`, 'g');

        if (regex.test(content)) {
            content = content.replace(regex, `$1$2${newBase}$3`);
            changed = true;
        }
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

function main() {
    console.log("Stage 3 (Retry): Deep-patching missed imports...");
    for (const dir of TARGET_DIRS) {
        scanDir(dir);
    }
    console.log("Done patching.");
}

main();
