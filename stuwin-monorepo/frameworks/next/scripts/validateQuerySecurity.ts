#!/usr/bin/env bun

// ═══════════════════════════════════════════════════════════════
// QUERY SECURITY VALIDATOR - SIMPLE PATTERN-BASED APPROACH
// ═══════════════════════════════════════════════════════════════
// Uses simple string patterns to validate secured endpoints
// Much more reliable than complex AST parsing
// ═══════════════════════════════════════════════════════════════

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';
import { allEndpoints } from '@/lib/app-route-configs';

interface ValidationResult {
  file: string;
  line: number;
  endpoint: string;
  variable: string;
  error: string;
  severity: 'error' | 'warning';
}

interface VariableOrigin {
  name: string;
  origin: string;
  line: number;
  source: string;
}

/**
 * Main validation function - Simple and reliable
 */
async function validateQuerySecurity(): Promise<void> {
  console.log('🔍 Starting Query Security Validation (Simple Pattern-Based)...\n');

  const results: ValidationResult[] = [];
  const apiFiles = findApiRouteFiles('./src/app/api');

  // Find endpoints with queryDataAuthenticated: true
  const securedEndpoints = Object.entries(allEndpoints).filter(([path, config]) =>
    (config as any).queryDataAuthenticated === true
  );

  if (securedEndpoints.length === 0) {
    console.log('⚠️  No endpoints with queryDataAuthenticated: true found');
    return;
  }

  console.log(`🔐 Found ${securedEndpoints.length} secured endpoints:\n`);
  securedEndpoints.forEach(([path, config]) => {
    console.log(`  • ${path}`);
  });
  console.log('');

  // Analyze each secured endpoint's corresponding file
  for (const [endpointPath, endpointConfig] of securedEndpoints) {
    const filePath = findApiFileForEndpoint(endpointPath, apiFiles);

    if (!filePath) {
      results.push({
        file: 'unknown',
        line: 0,
        endpoint: endpointPath,
        variable: 'N/A',
        error: 'API route file not found',
        severity: 'error'
      });
      continue;
    }

    console.log(`🔍 Analyzing: ${filePath}`);
    const fileResults = analyzeApiFile(filePath, endpointPath);
    results.push(...fileResults);
  }

  // Report results
  if (results.length === 0) {
    console.log('✅ All secured endpoints passed validation!');
    process.exit(0);
  }

  console.log('\n❌ Security violations found:\n');

  results.forEach(result => {
    const icon = result.severity === 'error' ? '🚨' : '⚠️ ';
    console.log(`${icon} ${result.file}:${result.line}`);
    console.log(`   Endpoint: ${result.endpoint}`);
    console.log(`   Variable: ${result.variable}`);
    console.log(`   Error: ${result.error}\n`);
  });

  const errorCount = results.filter(r => r.severity === 'error').length;
  const warningCount = results.filter(r => r.severity === 'warning').length;

  console.log(`\n📊 Summary:`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Warnings: ${warningCount}`);

  if (errorCount > 0) {
    console.log('\n💥 SECURITY VIOLATIONS DETECTED! Build aborted.');
    process.exit(1);
  }

  if (warningCount > 0) {
    console.log('\n⚠️  Warnings found. Consider fixing for better security.');
  }
}

/**
 * Find all API route files
 */
function findApiRouteFiles(dir: string): string[] {
  const files: string[] = [];

  function scanDirectory(currentDir: string) {
    try {
      const items = readdirSync(currentDir);

      for (const item of items) {
        const fullPath = join(currentDir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other unwanted directories
          if (item === 'node_modules' || item.startsWith('.') || item === 'dist') {
            continue;
          }
          scanDirectory(fullPath);
        } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(extname(fullPath))) {
          // Include route.ts files in api directories
          if (fullPath.includes('/api/') && (item === 'route.ts' || item === 'route.tsx')) {
            files.push(fullPath);
          }
        }
      }
    } catch (error: any) {
      console.log(`Error scanning directory ${currentDir}:`, error.message);
    }
  }

  scanDirectory(resolve(dir));
  return files;
}

/**
 * Find the API file corresponding to an endpoint path
 */
function findApiFileForEndpoint(endpointPath: string, apiFiles: string[]): string | null {
  // Convert endpoint path to file path
  // e.g., "/api/workspaces/student-workspace/:workspaceId/students/quizzes" -> "src/app/api/workspaces/student-workspace/[workspaceId]/quizzes/route.ts"

  let filePath = endpointPath
    .replace(/^\/api/, './src/app/api')
    .replace(/:([^\/]+)/g, '[$1]') + '/route.ts';

  // Handle the specific case where the endpoint has "students/quizzes" but the file is just "quizzes"
  if (filePath.includes('/students/quizzes/route.ts')) {
    filePath = filePath.replace('/students/quizzes/route.ts', '/quizzes/route.ts');
  }

  const resolvedPath = resolve(filePath);


  // If the file exists, return it directly
  if (require('fs').existsSync(resolvedPath)) {
    return resolvedPath;
  }

  // Fallback to checking the apiFiles array
  const found = apiFiles.find(file => resolve(file) === resolvedPath);
  if (found) {
    return found;
  }

  return null;
}

/**
 * Analyze an API file for security violations - Simple pattern-based approach
 */
function analyzeApiFile(filePath: string, endpointPath: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Check entire file for authData usage
  const fullContent = content.toLowerCase();
  const hasAuthDataReference = fullContent.includes('authdata.');

  if (!hasAuthDataReference) {
    results.push({
      file: filePath,
      line: 1,
      endpoint: endpointPath,
      variable: 'N/A',
      error: 'Secured endpoint does not reference authData anywhere - all query values must come from authenticated user data',
      severity: 'error'
    });
  }

  // Analyze the entire file for dangerous patterns in secured endpoints
  let lineIndex = 0;
  for (const line of lines) {
    lineIndex++;

    const trimmedLine = line.trim();

    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      continue;
    }

    const lineContent = line.toLowerCase().trim();

    // ❌ BLOCKED: Direct use of request parameters anywhere in the file
    if (lineContent.includes('params.') || lineContent.includes('request.')) {
      // But allow it in function parameters (like { authData, params } => ...)
      if (!lineContent.includes('function') && !lineContent.includes('=>') && !lineContent.includes('{')) {
        results.push({
          file: filePath,
          line: lineIndex,
          endpoint: endpointPath,
          variable: 'unknown',
          error: 'Secured endpoint contains direct reference to request parameters (params.* or request.*) which is not allowed',
          severity: 'error'
        });
      }
    }

    // Check database operations for additional patterns
    if (line.includes('db.query(') || line.includes('db.create(') ||
      line.includes('db.update(') || line.includes('db.delete(')) {

      const violations = analyzeDatabaseLine(line, lineIndex, filePath, endpointPath, lines);
      results.push(...violations);
    }
  }

  return results;
}

/**
 * Analyze a database operation line for security violations
 */
function analyzeDatabaseLine(line: string, lineIndex: number, filePath: string, endpointPath: string, allLines: string[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const lines = readFileSync(filePath, 'utf-8').split('\n');

  // Find the complete database call (may span multiple lines)
  let callEndIndex = lineIndex;
  let braceCount = 0;
  let parenCount = 0;

  // Count opening braces and parentheses
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '(') parenCount++;
    if (line[i] === ')') parenCount--;
    if (line[i] === '{') braceCount++;
    if (line[i] === '}') braceCount--;
  }

  // Find the end of the call
  while (callEndIndex < lines.length && (parenCount > 0 || braceCount > 0)) {
    callEndIndex++;
    const nextLine = lines[callEndIndex];
    for (let i = 0; i < nextLine.length; i++) {
      if (nextLine[i] === '(') parenCount++;
      if (nextLine[i] === ')') parenCount--;
      if (nextLine[i] === '{') braceCount++;
      if (nextLine[i] === '}') braceCount--;
    }
  }

  // Get the complete call
  const completeCall = lines.slice(lineIndex, callEndIndex + 1).join('\n');
  const completeCallLower = completeCall.toLowerCase();

  // ❌ BLOCKED: Direct use of request parameters anywhere in the call
  if (completeCallLower.includes('params.') || completeCallLower.includes('request.')) {
    results.push({
      file: filePath,
      line: lineIndex + 1,
      endpoint: endpointPath,
      variable: 'unknown',
      error: 'Database query contains direct reference to request parameters (params.* or request.*) which is not allowed in secured endpoints',
      severity: 'error'
    });
  }

  // ❌ BLOCKED: Hardcoded values that look like IDs
  const hardcodedPatterns = [
    /\$\w+\s*:\s*['"`][a-f0-9]{8,24}['"`]/i,  // UUID-like strings
    /\$\w+\s*:\s*\d+/  // Numeric IDs
  ];

  for (const pattern of hardcodedPatterns) {
    if (pattern.test(completeCall)) {
      results.push({
        file: filePath,
        line: lineIndex + 1,
        endpoint: endpointPath,
        variable: 'unknown',
        error: 'Database query appears to contain hardcoded ID values instead of authData-derived values',
        severity: 'error'
      });
      break; // Only report once per call
    }
  }

  return results;
}

/**
 * Analyze a single line for security violations
 */
function analyzeLine(line: string, allLines: string[], lineIndex: number, filePath: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check if this is a db.query, db.create, db.update, or db.delete call
  if (!line.includes('db.query(') && !line.includes('db.create(') &&
    !line.includes('db.update(') && !line.includes('db.delete(')) {
    return results;
  }

  // Find the complete database call (may span multiple lines)
  let callEndIndex = lineIndex;
  let braceCount = 0;
  let parenCount = 0;

  // Count opening braces and parentheses
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '(') parenCount++;
    if (line[i] === ')') parenCount--;
    if (line[i] === '{') braceCount++;
    if (line[i] === '}') braceCount--;
  }

  // Find the end of the call
  while (callEndIndex < allLines.length && (parenCount > 0 || braceCount > 0)) {
    callEndIndex++;
    const nextLine = allLines[callEndIndex];
    for (let i = 0; i < nextLine.length; i++) {
      if (nextLine[i] === '(') parenCount++;
      if (nextLine[i] === ')') parenCount--;
      if (nextLine[i] === '{') braceCount++;
      if (nextLine[i] === '}') braceCount--;
    }
  }

  // Extract the complete call
  const completeCall = allLines.slice(lineIndex, callEndIndex + 1).join('\n');

  // Extract variables from SQL template (inside backticks)
  const templateMatch = completeCall.match(/`([^`]*)`/);
  if (templateMatch) {
    const sqlTemplate = templateMatch[1];
    const varMatches = sqlTemplate.match(/\$(\w+)/g);

    if (varMatches) {
      const variables = varMatches.map(match => match.substring(1));

      // Extract parameter object (second argument to db.query/db.create/etc)
      const paramMatch = completeCall.match(/,\s*\{([^}]*)\}/);
      if (paramMatch) {
        const paramObj = paramMatch[1];

        // For each SQL variable, find the corresponding parameter
        for (const sqlVar of variables) {
          // Try both full syntax (var: value) and shorthand syntax (var)
          let paramRegex = new RegExp(`${sqlVar}\\s*:\\s*([^,}]+)`);
          let paramMatch = paramObj.match(paramRegex);

          if (!paramMatch) {
            // Try shorthand syntax - just the variable name
            paramRegex = new RegExp(`\\b${sqlVar}\\b`);
            paramMatch = paramObj.match(paramRegex);
            if (paramMatch) {
              // In shorthand, the value is the same as the variable name
              paramMatch = [paramMatch[0], sqlVar];
            }
          }

          if (paramMatch) {
            const paramValue = paramMatch[1].trim();

            // If the parameter is a simple variable name, trace its origin
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(paramValue)) {
              const origin = traceVariableOrigin(paramValue, allLines, lineIndex, filePath);

              if (origin.origin !== 'authData') {
                results.push({
                  file: filePath,
                  line: lineIndex + 1,
                  endpoint: 'unknown',
                  variable: sqlVar,
                  error: `SQL parameter '$${sqlVar}' uses variable '${paramValue}' from ${origin.origin} (${origin.source}) but must come from authData`,
                  severity: 'error'
                });
              }
            } else {
              // Complex expression - for now, assume it's ok if it contains 'authData'
              if (!paramValue.includes('authData')) {
                results.push({
                  file: filePath,
                  line: lineIndex + 1,
                  endpoint: 'unknown',
                  variable: sqlVar,
                  error: `SQL parameter '$${sqlVar}' uses complex expression '${paramValue}' that doesn't reference authData`,
                  severity: 'error'
                });
              }
            }
          } else {
            results.push({
              file: filePath,
              line: lineIndex + 1,
              endpoint: 'unknown',
              variable: sqlVar,
              error: `SQL parameter '$${sqlVar}' not found in parameter object`,
              severity: 'error'
            });
          }
        }
      } else {
        results.push({
          file: filePath,
          line: lineIndex + 1,
          endpoint: 'unknown',
          variable: 'unknown',
          error: 'Could not find parameter object for database call',
          severity: 'warning'
        });
      }
    }
  }

  return results;
}

/**
 * Trace the origin of a variable to determine if it comes from authData
 */
function traceVariableOrigin(
  variableName: string,
  lines: string[],
  currentLine: number,
  filePath: string
): VariableOrigin {
  // Look backwards from current line to find variable declaration
  for (let i = currentLine; i >= 0; i--) {
    const line = lines[i].trim();

    // Look for variable assignment: const variableName = ...
    const assignmentPattern = new RegExp(`(?:const|let|var)\\s+${variableName}\\s*=\\s*(.+?);?\\s*$`);
    const match = line.match(assignmentPattern);

    if (match) {
      const assignment = match[1].trim();

      // Check if it comes from authData
      if (assignment.includes('authData.')) {
        return {
          name: variableName,
          origin: 'authData',
          line: i + 1,
          source: assignment
        };
      }

      // Check if it comes from params, request, etc.
      if (assignment.includes('params.') || assignment.includes('request.')) {
        return {
          name: variableName,
          origin: assignment.includes('params.') ? 'params' : 'request',
          line: i + 1,
          source: assignment
        };
      }

      // Check if it's a function parameter
      if (assignment.includes('authData')) {
        // Function parameter from handler context
        return {
          name: variableName,
          origin: 'authData',
          line: i + 1,
          source: 'function parameter'
        };
      }

      // Unknown origin
      return {
        name: variableName,
        origin: 'unknown',
        line: i + 1,
        source: assignment
      };
    }

    // Also check function parameters
    const paramPattern = new RegExp(`(?:function|\\{)\\s*.*\\b${variableName}\\b.*(?:\\}|=>)`);
    if (line.match(paramPattern)) {
      return {
        name: variableName,
        origin: 'authData', // Assume handler parameters come from authData
        line: i + 1,
        source: 'function parameter'
      };
    }
  }

  return {
    name: variableName,
    origin: 'unknown',
    line: 0,
    source: 'not found'
  };
}

// Run validation if called directly
if ((import.meta as any).main) {
  validateQuerySecurity().catch((error: any) => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { validateQuerySecurity, type ValidationResult };
