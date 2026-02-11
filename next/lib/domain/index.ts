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
export * from './subject';
export * from './topic';
export * from './question';
export * from './auth';
export * from './workspace';
export * from './role';
export * from './content';
export * from './activity';
export * from './quiz';
export * from './homework';
export * from './ai-session';
export * from './support';
export * from './jobs';
export * from './payment';
export * from './ai-prompt';
