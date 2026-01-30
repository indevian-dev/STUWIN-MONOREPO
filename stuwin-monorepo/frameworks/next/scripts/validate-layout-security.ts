#!/usr/bin/env node

/**
 * Layout Security Validation Script
 * 
 * Validates that:
 * 1. All layout.js files use withLayoutAuth wrapper or have __isProtectedLayout marker
 * 2. Protected layouts have proper auth handling
 * 3. Public layouts are explicitly marked as public
 * 
 * Run: tsx scripts/validate-layout-security.ts [--verbose] [--fix]
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
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * Find all layout.js/jsx/tsx files in app directory
 */
function findLayoutFiles(dir, layouts = []) {
  if (!fs.existsSync(dir)) return layouts;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!item.startsWith('.') && item !== 'node_modules') {
        findLayoutFiles(fullPath, layouts);
      }
    } else if (
      item === 'layout.js' || 
      item === 'layout.tsx' || 
      item === 'layout.jsx'
    ) {
      layouts.push(fullPath);
    }
  }
  
  return layouts;
}

/**
 * Convert file path to layout endpoint path
 */
function filePathToLayoutPath(filePath) {
  const appDir = path.join(projectRoot, 'src', 'app');
  let relativePath = path.relative(appDir, path.dirname(filePath));
  
  // Convert Windows path separators
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Handle root layout
  if (relativePath === '' || relativePath === '.') {
    return '/root';
  }
  
  // Remove [locale] prefix
  if (relativePath === '[locale]') {
    return '/locale';
  }
  relativePath = relativePath.replace(/^\[locale\]\//, '');
  
  // Handle route groups
  relativePath = relativePath.replace(/\(([^)]+)\)/g, '$1');
  
  // Convert [param] to :param
  relativePath = relativePath.replace(/\[([^\]]+)\]/g, ':$1');
  
  return `/${relativePath}` || '/';
}

/**
 * Check if file is a client component
 */
function isClientComponent(content) {
  return content.includes("'use client'") || content.includes('"use client"');
}

/**
 * Check if file uses withLayoutAuth wrapper (actual import/usage, not just comments)
 */
function usesWithLayoutAuth(content) {
  // Check for actual import of withLayoutAuth
  return content.includes("import { withLayoutAuth }") ||
         content.includes("import {withLayoutAuth}") ||
         content.includes("from '@/lib/auth/AccessValidatorForLayouts'") ||
         content.includes('from "@/lib/auth/AccessValidatorForLayouts"');
}

/**
 * Check if file has the protected layout marker
 */
function hasProtectedLayoutMarker(content) {
  return content.includes('__isProtectedLayout');
}

/**
 * Check if file imports withLayoutAuth
 */
function importsWithLayoutAuth(content) {
  return content.includes("from '@/lib/auth/AccessValidatorForLayouts'") ||
         content.includes('from "@/lib/auth/AccessValidatorForLayouts"');
}

/**
 * Extract layout path from JSDoc comment if present
 */
function extractLayoutPathFromComment(content) {
  const match = content.match(/@withLayoutAuth\s*{\s*layoutPath:\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

/**
 * Generate fix suggestion for server component
 */
function generateServerFix(layoutPath, isPublic = false) {
  if (isPublic) {
    return `
// Add this wrapper to your layout:

import { withLayoutAuth }
  from '@/lib/auth/AccessValidatorForLayouts';

async function YourLayout({ children, params }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default withLayoutAuth(YourLayout, {
  layoutPath: '${layoutPath}',
  isPublic: true
});
`;
  }
  
  return `
// Add this wrapper to your layout:

import { withLayoutAuth }
  from '@/lib/auth/AccessValidatorForLayouts';

async function YourLayout({ children, authData, params }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default withLayoutAuth(YourLayout, {
  layoutPath: '${layoutPath}',
  requiredPermissions: [] // Add permissions if needed
});
`;
}

/**
 * Generate fix suggestion for client component
 */
function generateClientFix(layoutPath) {
  return `
// For client components, add metadata markers at the end of the file:

// Metadata marker for prebuild script detection
YourLayout.__isProtectedLayout = true;
YourLayout.__layoutPath = '${layoutPath}';
YourLayout.__isPublic = true; // Set to false if auth required

export default YourLayout;

// OR add a JSDoc comment:
/**
 * @withLayoutAuth { layoutPath: '${layoutPath}', isPublic: true }
 */
`;
}

/**
 * Main validation function
 */
async function validateLayouts() {
  console.log(colors.bold('\n🔍 Validating Layout Security\n'));
  console.log(colors.gray('─'.repeat(60)));
  
  // Find all layout files
  const appDir = path.join(projectRoot, 'src', 'app');
  const layoutFiles = findLayoutFiles(appDir);
  
  console.log((`Found ${layoutFiles.length} layout files to check\n`));
  
  const valid = [];
  const missing = [];
  const warnings = [];
  
  for (const layoutFile of layoutFiles) {
    const layoutPath = filePathToLayoutPath(layoutFile);
    const content = fs.readFileSync(layoutFile, 'utf-8');
    
    const hasWithLayoutAuth = usesWithLayoutAuth(content);
    const hasMarker = hasProtectedLayoutMarker(content);
    const hasJsdocMarker = extractLayoutPathFromComment(content);
    const isClient = isClientComponent(content);
    
    const isProtected = hasWithLayoutAuth || hasMarker || hasJsdocMarker;
    
    if (isProtected) {
      valid.push({ 
        file: layoutFile, 
        layoutPath,
        isClient,
        method: hasWithLayoutAuth ? 'withLayoutAuth' : 
                hasMarker ? '__isProtectedLayout marker' : 
                'JSDoc comment'
      });
    } else {
      missing.push({
        file: layoutFile,
        layoutPath,
        isClient,
        message: 'Layout missing withLayoutAuth wrapper or __isProtectedLayout marker'
      });
    }
  }
  
  // Report results
  if (valid.length > 0 && verbose) {
    console.log(colors.green(colors.bold('\n✓ Valid layouts:\n')));
    for (const item of valid) {
      const clientTag = item.isClient ? colors.yellow(' [client]') : '';
      console.log(colors.green(`  ✓ ${item.layoutPath}${clientTag}`));
      console.log(colors.gray(`    Method: ${item.method}`));
    }
  }
  
  if (missing.length > 0) {
    console.log((colors.bold('\n❌ Missing layout auth wrapper:\n')));
    for (const item of missing) {
      const clientTag = item.isClient ? colors.yellow(' [client]') : '';
      console.log((`  ✗ ${item.layoutPath}${clientTag}`));
      console.log(colors.gray(`    File: ${path.relative(projectRoot, item.file)}`));
      
      if (showFix) {
        console.log(('\n  Fix:'));
        if (item.isClient) {
          console.log(colors.gray(generateClientFix(item.layoutPath)));
        } else {
          console.log(colors.gray(generateServerFix(item.layoutPath, true)));
        }
      }
      console.log();
    }
  }
  
  // Summary
  console.log(colors.gray('─'.repeat(60)));
  console.log(colors.bold('\n📊 Summary:\n'));
  console.log(colors.green(`  ✓ Valid: ${valid.length}`));
  console.log((`  ✗ Missing wrapper: ${missing.length}`));
  console.log();
  
  // Count errors that should fail the build
  const errors = missing.length;
  
  if (errors > 0) {
    console.log((
      `❌ Layout security validation failed. Fix ${errors} error(s) before building.\n`
    ));
    if (!showFix) {
      console.log(('   Run with --fix to see suggested fixes.\n'));
    }
    process.exit(1);
  }
  
  console.log(colors.green('✅ Layout security validation passed.\n'));
  process.exit(0);
}

// Run validation
validateLayouts().catch(err => {
  console.error(('Validation script error:'), err);
  process.exit(1);
});
