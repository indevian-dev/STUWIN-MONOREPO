/**
 * Module Exports - Central barrel file for all domain modules
 * 
 * Each module is self-contained with:
 * - Repository (database layer)
 * - Service (business logic)
 * - Types (TypeScript interfaces)
 * - Schema (Zod validation)
 */

// Module Factory - Primary access point
export { ModuleFactory } from './factory';

// Individual Modules
export * from './learning';
export * from './auth';
export * from './workspace';
export * from './content';
export * from './activity';
export * from './support';
export * from './jobs';




