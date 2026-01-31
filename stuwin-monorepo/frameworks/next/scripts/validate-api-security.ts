#!/usr/bin/env node

/**
 * API Route Security Validation Script
 *
 * Validates that:
 * 1. All API routes in src/app/api/workspaces/ are configured in endpoint files
 * 2. All routes use withApiHandler wrapper
 * 3. HTTP methods in route files match endpoint configuration
 * 4. No direct db imports (must use db from handler context)
 *
 * Run: tsx scripts/validate-api-security.ts
 * Runs automatically in prebuild
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Colors for console output
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * Find all route.js files in the api directory
 */
function findRouteFiles(dir: string, routes: string[] = []): string[] {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findRouteFiles(fullPath, routes);
    } else if (item === "route.js" || item === "route.ts") {
      routes.push(fullPath);
    }
  }

  return routes;
}

/**
 * Convert file path to API endpoint path
 */
function filePathToEndpoint(filePath: string): string {
  const apiDir = path.join(projectRoot, "src", "app", "api");
  let relativePath = path.relative(apiDir, path.dirname(filePath));

  // Convert Windows path separators
  relativePath = relativePath.replace(/\\/g, "/");

  // Remove Next.js route groups (folders with parentheses)
  // e.g., (public)/cities -> cities, (auth)/login -> login
  relativePath = relativePath.replace(/\([^)]+\)\/?/g, "");

  // Convert [param] to :param
  relativePath = relativePath.replace(/\[([^\]]+)\]/g, ":$1");

  // If the path already starts with workspaces/, don't add another workspaces/ prefix
  if (relativePath.startsWith("workspaces/")) {
    return `/api/${relativePath}`;
  }

  // Auth routes don't need workspace prefix - they're global
  if (relativePath.startsWith("auth/")) {
    return `/api/${relativePath}`;
  }

  return `/api/workspaces/${relativePath}`;
}

/**
 * Parse endpoint configuration files
 */
async function parseAllEndpointsConfig(): Promise<Record<string, any>> {
  const endpoints: Record<string, any> = {};

  const files = [
    "../src/lib/endpoints/auth/auth_endpoints.ts",
    "../src/lib/endpoints/workspaces/staff/staff_endpoints.ts",
    "../src/lib/endpoints/workspaces/student/student_endpoints.ts",
    "../src/lib/endpoints/workspaces/provider/provider_endpoints.ts",
    "../src/lib/endpoints/workspaces/eduOrganization/eduOrganization_endpoints.ts",
    "../src/lib/endpoints/public/public_endpoints.ts",
    "../src/lib/endpoints/system/system_apis.ts",
  ];

  for (const file of files) {
    try {
      const filePath = path.resolve(__dirname, file);
      if (!fs.existsSync(filePath)) {
        console.warn(colors.yellow(`⚠ File not found: ${file}`));
        continue;
      }

      const content = fs.readFileSync(filePath, "utf-8");

      // Extract endpoint definitions using regex (with optional TypeScript type annotation)
      const exportMatch = content.match(
        /export\s+const\s+\w+\s*:\s*\w+\s*=\s*\{([\s\S]*?)\};?\s*$/m,
      );
      if (!exportMatch) {
        // Try without type annotation as fallback
        const simpleMatch = content.match(
          /export\s+const\s+\w+\s*=\s*\{([\s\S]*?)\};?\s*$/m,
        );
        if (!simpleMatch) {
          console.warn(colors.yellow(`⚠ No endpoint exports found in ${file}`));
          continue;
        }
      }

      // Find all endpoint paths - looking for createEndpoint() calls
      const pathRegex = /"([^"]+)":\s*createEndpoint\(/g;
      let match;

      while ((match = pathRegex.exec(content)) !== null) {
        const endpointPath = match[1];
        // Process both API and page endpoints
        if (
          endpointPath.startsWith("/api/workspaces/") ||
          !endpointPath.startsWith("/api/workspaces/")
        ) {
          // Extract method and authRequired from createEndpoint call
          const configStartIndex = match.index + match[0].length;
          const configContent = content.slice(
            configStartIndex,
            configStartIndex + 500,
          );

          // Parse createEndpoint arguments (object syntax: { method: "POST", authRequired: true })
          const methodMatch = configContent.match(
            /method:\s*(?:"([^"]+)"|'([^']+)'|\[([^\]]+)\])/,
          );
          const authMatch = configContent.match(/authRequired:\s*(true|false)/);

          let method: string | string[] = "GET";
          if (methodMatch) {
            if (methodMatch[1] || methodMatch[2]) {
              method = methodMatch[1] || methodMatch[2];
            } else if (methodMatch[3]) {
              // Handle array of methods like ["GET", "POST"]
              method = methodMatch[3].replace(/["'\s]/g, "").split(",");
            }
          }

          // Only include API endpoints (not page endpoints)
          if (endpointPath.startsWith("/api/workspaces/") || endpointPath.startsWith("/api/auth/")) {
            endpoints[endpointPath] = {
              method: Array.isArray(method) ? method : [method],
              authRequired: authMatch ? authMatch[1] === "true" : false,
              source: file,
            };
          }
        }
      }
    } catch (err: any) {
      console.error(`Warning: Could not parse ${file}: ${err.message}`);
    }
  }

  return endpoints;
}

/**
 * Check if route file uses withApiHandler
 */
function usesWithApiHandler(content: string): boolean {
  return content.includes("withApiHandler");
}

/**
 * Extract exported HTTP methods from route file
 */
function extractExportedMethods(content: string): string[] {
  const methods = [];
  const methodRegex =
    /export\s+(?:async\s+)?(?:function\s+)?(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
  // Updated regex to handle TypeScript type annotations: export const GET: Type = ...
  const constMethodRegex =
    /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*(?::\s*[^=]+)?\s*=/g;

  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1]);
  }
  while ((match = constMethodRegex.exec(content)) !== null) {
    methods.push(match[1]);
  }

  return [...new Set(methods)];
}

/**
 * Check for direct db imports (security violation)
 */
function hasDirectDbImport(content: string): { found: boolean; line: number } {
  const lines = content.split("\n");
  const directDbImportRegex =
    /import\s*\{[^}]*\bdb\b[^}]*\}\s*from\s*['"]@\/db['"]/;

  for (let i = 0; i < lines.length; i++) {
    if (directDbImportRegex.test(lines[i])) {
      return { found: true, line: i + 1 };
    }
  }

  return { found: false, line: 0 };
}

/**
 * Main validation function
 */
async function validateApiRoutes() {
  console.log(colors.bold("\n🔍 Validating API Route Security\n"));
  console.log(colors.gray("─".repeat(60)));

  const apiDir = path.join(projectRoot, "src", "app", "api");

  if (!fs.existsSync(apiDir)) {
    console.log("⚠ No api directory found");
    process.exit(0);
  }

  const routeFiles = findRouteFiles(apiDir);
  const endpointsConfig = await parseAllEndpointsConfig();

  console.log(`Found ${routeFiles.length} route files`);
  console.log(
    `Found ${Object.keys(endpointsConfig).length} configured endpoints\n`,
  );

  const errors = [];
  const warnings = [];
  const passed = [];

  for (const routeFile of routeFiles) {
    const endpoint = filePathToEndpoint(routeFile);
    const content = fs.readFileSync(routeFile, "utf-8");
    const exportedMethods = extractExportedMethods(content);
    const config = endpointsConfig[endpoint];

    // Check if endpoint is configured
    if (!config) {
      warnings.push({
        file: routeFile,
        endpoint,
        message: "Endpoint not found in configuration files",
        type: "missing_config",
      });
      continue;
    }

    // Check if ALL routes use withApiHandler (both public and protected)
    if (!usesWithApiHandler(content)) {
      errors.push({
        file: routeFile,
        endpoint,
        message:
          "All API routes must use withApiHandler wrapper (regardless of authRequired)",
        type: "missing_wrapper",
      });
      continue;
    }

    // Check for direct db imports (SECURITY: must use db from handler context)
    const dbImportCheck = hasDirectDbImport(content);
    if (dbImportCheck.found) {
      errors.push({
        file: routeFile,
        endpoint,
        message: `Direct db import detected at line ${dbImportCheck.line}. Use db from handler context: withApiHandler(async (request, { db }) => ...)`,
        type: "direct_db_import",
      });
      continue;
    }

    // Check method mismatch
    const configMethods = config.method.map((m: string) => m.toUpperCase());
    const missingMethods = configMethods.filter(
      (m: string) => !exportedMethods.includes(m),
    );

    if (missingMethods.length > 0) {
      warnings.push({
        file: routeFile,
        endpoint,
        message: `Config defines ${missingMethods.join(", ")} but not exported in route`,
        type: "method_mismatch",
      });
    }

    passed.push({ endpoint, config });
  }

  // Report results
  if (errors.length > 0) {
    console.log(colors.bold("\n❌ SECURITY ERRORS (must fix):\n"));
    for (const error of errors) {
      console.log(`  ✗ ${error.endpoint}`);
      console.log(colors.gray(`    ${error.message}`));
      console.log(
        colors.gray(`    File: ${path.relative(projectRoot, error.file)}`),
      );
      console.log();
    }
  }

  if (warnings.length > 0) {
    console.log(colors.bold("\n⚠ WARNINGS:\n"));
    for (const warning of warnings) {
      console.log(`  ⚠ ${warning.endpoint}`);
      console.log(colors.gray(`    ${warning.message}`));
      console.log(
        colors.gray(`    File: ${path.relative(projectRoot, warning.file)}`),
      );
      console.log();
    }
  }

  // Summary
  console.log(colors.gray("─".repeat(60)));
  console.log(colors.bold("\n📊 Summary:\n"));
  console.log(`  ✓ Passed: ${passed.length}`);
  console.log(`  ⚠ Warnings: ${warnings.length}`);
  console.log(`  ✗ Errors: ${errors.length}`);
  console.log();

  // Exit with error code if there are errors
  if (errors.length > 0) {
    console.log(
      "❌ API security validation failed. Fix errors before building.\n",
    );
    process.exit(1);
  }

  console.log("✅ API security validation passed.\n");
  process.exit(0);
}

// Run validation
validateApiRoutes().catch((err: any) => {
  console.error("Validation script error:", err);
  process.exit(1);
});
