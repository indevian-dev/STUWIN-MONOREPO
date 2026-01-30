// ═══════════════════════════════════════════════════════════════
// UI TYPES - CENTRAL EXPORTS
// ═══════════════════════════════════════════════════════════════
// Shared UI types organized by purpose
//
// 📋 USAGE GUIDELINES:
// ═══════════════════════════════════════════════════════════════
//
// 1. BASE TYPES (types/ui/base/)
//    - Import these when you need to EXTEND a base interface
//    - Example: extends BaseModalProps, extends BaseFormProps
//
// 2. CONTRACTS (types/ui/contracts/)
//    - Import these when you need shared types/interfaces
//    - Example: SelectOption<T>, FormMode
//
// 3. UTILITIES (types/ui/utilities/)
//    - Import these for type helpers and utilities
//    - Example: FormState<T>, AsyncData<T>
//
// 4. COMPONENT-SPECIFIC PROPS
//    - Define INLINE in your component file
//    - Do NOT add to this folder unless used in 2+ domains
//
// ═══════════════════════════════════════════════════════════════

// Base Interfaces (extend these)
export * from './base';

// Shared Contracts (use as-is)
export * from './contracts';

// Type Utilities (helper types)
export * from './utilities';

// Navigation Types
export * from './navigation';

// ═══════════════════════════════════════════════════════════════
// QUICK REFERENCE
// ═══════════════════════════════════════════════════════════════
//
// Import base types:
// import { BaseModalProps, BaseFormProps } from '@/types';
//
// Import contracts:
// import { SelectOption, FormMode } from '@/types';
//
// Component-specific props (define inline):
// interface StudentQuizAnalysisModalProps extends BaseModalProps {
//   quizId: number;
//   studentId: number;
// }
//
