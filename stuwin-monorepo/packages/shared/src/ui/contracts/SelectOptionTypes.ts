// ═══════════════════════════════════════════════════════════════
// SELECT OPTION TYPES
// ═══════════════════════════════════════════════════════════════
// Shared contract for select/dropdown options across all domains

/**
 * Standard select option interface
 * Use this for any select/dropdown components
 * 
 * @example
 * ```typescript
 * const subjects: SelectOption<number>[] = [
 *   { value: 1, label: 'Mathematics' },
 *   { value: 2, label: 'Physics', disabled: true }
 * ];
 * ```
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

