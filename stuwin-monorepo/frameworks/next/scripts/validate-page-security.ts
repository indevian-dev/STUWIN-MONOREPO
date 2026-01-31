#!/usr/bin/env node

/**
 * Page Security Validation Script
 * 
 * Validates that:
 * 1. Protected pages (authRequired: true) use withPageAuth wrapper
 * 2. Client components in protected routes are identified for refactoring
 * 3. All protected page routes have proper auth handling
 * 
 * Run: tsx scripts/validate-page-security.ts [--verbose] [--fix]
 * Runs automatically in prebuild
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const showFix = args.includes('--fix');

// Colors for console output
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * Load page endpoint configurations
 */
interface PageConfig {
  authRequired: boolean;
  permission: string | null;
  source: string;
}

function loadPageEndpoints() {
  const endpoints: Record<string, PageConfig> = {};

  const files = [
    { path: '../src/lib/endpoints/base_pages.js', prefix: '' },
    { path: '../src/lib/endpoints/console_pages.js', prefix: 'console' },
    { path: '../src/lib/endpoints/dashboard_pages.js', prefix: 'dashboard' },
  ];

  for (const file of files) {
    try {
      const filePath = path.resolve(__dirname, file.path);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf-8');

      // Find all page paths
      const pathRegex = /"([^"]+)":\s*CR\((true|false)/g;
      let match;

      while ((match = pathRegex.exec(content)) !== null) {
        const pagePath = match[1];
        const authRequired = match[2] === 'true';

        // Extract permission if present
        const afterCr = content.slice(match.index + match[0].length, match.index + match[0].length + 100);
        const permMatch = afterCr.match(/,\s*["']([^"']+)["']/);

        endpoints[pagePath] = {
          authRequired,
          permission: permMatch ? permMatch[1] : null,
          source: file.prefix || 'base'
        };
      }
    } catch (err: any) {
      console.error(colors.yellow(`Warning: Could not parse ${file.path}: ${err.message}`));
    }
  }

  return endpoints;
}

/**
 * Find all page.js files in locale directories
 */
function findPageFiles(dir: string, pages: string[] = []) {
  if (!fs.existsSync(dir)) return pages;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!item.startsWith('.') && item !== 'node_modules') {
        findPageFiles(fullPath, pages);
      }
    } else if (item === 'page.js' || item === 'page.tsx' || item === 'page.jsx') {
      pages.push(fullPath);
    }
  }

  return pages;
}

/**
 * Convert file path to page endpoint path
 */
function filePathToPagePath(filePath: string) {
  const appDir = path.join(projectRoot, 'src', 'app');
  let relativePath = path.relative(appDir, path.dirname(filePath));

  // Convert Windows path separators
  relativePath = relativePath.replace(/\\/g, '/');

  // Remove [locale] prefix
  relativePath = relativePath.replace(/^\[locale\]\//, '');
  relativePath = relativePath.replace(/^\(locale\)\//, '');

  // Remove route groups
  relativePath = relativePath.replace(/\([^)]+\)\//g, '');

  // Convert [param] to :param
  relativePath = relativePath.replace(/\[([^\]]+)\]/g, ':$1');

  return `/${relativePath}` || '/';
}

/**
 * Check if file is a client component
 */
function isClientComponent(content: string) {
  return content.includes("'use client'") || content.includes('"use client"');
}

/**
 * Check if file uses withPageAuth
 */
function usesWithPageAuth(content: string) {
  return content.includes('withPageAuth');
}

/**
 * Check if file imports withPageAuth
 */
function importsWithPageAuth(content: string) {
  return content.includes("from '@/app/PageRequestValidator'") ||
    content.includes('from "@/app/PageRequestValidator"') ||
    content.includes("from '../PageRequestValidator'") ||
    content.includes("from '../../PageRequestValidator'");
}

/**
 * Generate fix suggestion
 */
function generateFix(pagePath: string, permission: string | null | undefined) {
  const permPart = permission ? `\n  // Permission: ${permission}` : '';

  return `
// Add this wrapper to your page:

import { withPageAuth } from '@/app/PageRequestValidator';

export default withPageAuth(
  async function Page({ authData, params }) {${permPart}
    // Your existing page code here
    return (
      <div>
        {/* Page content */}
      </div>
    );
  },
  { pagePath: '${pagePath}' }
);
`;
}

/**
 * Main validation function
 */
async function validatePages() {
  console.log(colors.bold('\n🔍 Validating Page Security\n'));
  console.log(colors.gray('─'.repeat(60)));

  const endpoints = loadPageEndpoints();
  const protectedPaths = Object.entries(endpoints)
    .filter(([, config]) => config.authRequired)
    .map(([path, config]) => ({ path, ...config }));

  console.log((`Found ${protectedPaths.length} protected page routes\n`));

  // Find all page files
  const localeDir = path.join(projectRoot, 'src', 'app', '[locale]');
  const pageFiles = findPageFiles(localeDir);

  console.log((`Found ${pageFiles.length} page files to check\n`));

  const valid = [];
  const missing = [];
  const warnings = [];
  const clientComponents = [];

  for (const pageFile of pageFiles) {
    const pagePath = filePathToPagePath(pageFile);
    const content = fs.readFileSync(pageFile, 'utf-8');

    // Check if this is a protected path
    const isProtected = protectedPaths.some(p =>
      pagePath === p.path ||
      pagePath.startsWith(p.path.replace(':id', ''))
    );

    const protectedConfig = protectedPaths.find(p =>
      pagePath === p.path ||
      pagePath.startsWith(p.path.replace(':id', ''))
    );

    const hasWithPageAuth = usesWithPageAuth(content);
    const isClient = isClientComponent(content);

    if (isProtected) {
      if (isClient) {
        clientComponents.push({
          file: pageFile,
          pagePath,
          message: 'Protected page is a client component - needs refactoring',
          config: protectedConfig
        });
      } else if (!hasWithPageAuth) {
        missing.push({
          file: pageFile,
          pagePath,
          message: 'Protected page missing withPageAuth wrapper',
          config: protectedConfig
        });
      } else {
        valid.push({ file: pageFile, pagePath });
      }
    } else {
      // Not protected - check if it unnecessarily uses withPageAuth
      if (hasWithPageAuth) {
        if (verbose) {
          warnings.push({
            file: pageFile,
            pagePath,
            message: 'Page uses withPageAuth but is not in protected routes config'
          });
        }
      }
    }
  }

  // Report results
  if (valid.length > 0 && verbose) {
    console.log(colors.green(colors.bold('\n✓ Valid protected pages:\n')));
    for (const item of valid) {
      console.log(colors.green(`  ✓ ${item.pagePath}`));
    }
  }

  if (missing.length > 0) {
    console.log((colors.bold('\n❌ Missing withPageAuth wrapper:\n')));
    for (const item of missing) {
      console.log((`  ✗ ${item.pagePath}`));
      console.log(colors.gray(`    File: ${path.relative(projectRoot, item.file)}`));
      if (item.config?.permission) {
        console.log(colors.gray(`    Permission: ${item.config.permission}`));
      }
      if (showFix) {
        console.log(('\n  Fix:'));
        console.log(colors.gray(generateFix(item.pagePath, item.config?.permission)));
      }
      console.log();
    }
  }

  if (clientComponents.length > 0) {
    console.log(colors.yellow(colors.bold('\n⚠ Client components in protected routes (need refactoring):\n')));
    for (const item of clientComponents) {
      console.log(colors.yellow(`  ⚠ ${item.pagePath}`));
      console.log(colors.gray(`    File: ${path.relative(projectRoot, item.file)}`));
      console.log(colors.gray(`    Issue: Client components cannot use withPageAuth directly`));
      console.log(colors.gray(`    Solution: Convert to Server Component or create a wrapper`));
      console.log();
    }
  }

  if (warnings.length > 0 && verbose) {
    console.log(colors.yellow(colors.bold('\n⚠ Warnings:\n')));
    for (const item of warnings) {
      console.log(colors.yellow(`  ⚠ ${item.pagePath}`));
      console.log(colors.gray(`    ${item.message}`));
      console.log();
    }
  }

  // Summary
  console.log(colors.gray('─'.repeat(60)));
  console.log(colors.bold('\n📊 Summary:\n'));
  console.log(colors.green(`  ✓ Valid: ${valid.length}`));
  console.log(colors.yellow(`  ⚠ Client components: ${clientComponents.length}`));
  console.log((`  ✗ Missing wrapper: ${missing.length}`));
  if (verbose) {
    console.log(colors.gray(`  ? Warnings: ${warnings.length}`));
  }
  console.log();

  // Count errors that should fail the build
  const protectedErrors = missing.length; // Only server components without wrapper

  if (protectedErrors > 0) {
    console.log((`❌ Page security validation failed. Fix ${protectedErrors} error(s) before building.\n`));
    if (!showFix) {
      console.log(('   Run with --fix to see suggested fixes.\n'));
    }
    process.exit(1);
  }

  if (clientComponents.length > 0) {
    console.log(colors.yellow('⚠ Some client components need refactoring but build will continue.\n'));
  }

  console.log(colors.green('✅ Page security validation passed.\n'));
  process.exit(0);
}

// Run validation
validatePages().catch(err => {
  console.error(('Validation script error:'), err);
  process.exit(1);
});
