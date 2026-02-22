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
export { ModuleFactory } from './Domain.factory';

// Individual Modules
export * from './learning/_Learning.index';
export * from './subject/_Subject.index';
export * from './topic/_Topic.index';
export * from './question/_Question.index';
export * from './auth/_Auth.index';
export * from './workspace/_Workspace.index';
export * from './role/_Role.index';
export * from './content/_Content.index';
export * from './activity/_Activity.index';
export * from './quiz/_Quiz.index';
export * from './homework/_Homework.index';
export * from './ai-session/_AiSession.index';
export * from './support/_Support.index';
export * from './jobs/_Jobs.index';
export * from './payment/_Payment.index';
export * from './ai-prompt/_AiPrompt.index';
