// ═══════════════════════════════════════════════════════════════
// FORM MODE TYPES
// ═══════════════════════════════════════════════════════════════
// Shared contract for form modes across all domains

/**
 * Standard form modes
 * Use this to control form behavior (create new, edit existing, view only)
 * 
 * @example
 * ```typescript
 * interface QuestionFormProps {
 *   mode: FormMode;
 *   question?: Question;
 * }
 * ```
 */
export type FormMode = 'create' | 'edit' | 'view';

