// ═══════════════════════════════════════════════════════════════
// BASE FORM TYPES
// ═══════════════════════════════════════════════════════════════
// Base interface for form components - EXTEND THIS in your forms

/**
 * Base props that all form components should extend
 * 
 * @example
 * ```typescript
 * interface StudentProfileFormProps extends BaseFormProps {
 *   initialData: StudentProfile;
 *   onUpdate: (data: StudentProfile) => void;
 * }
 * ```
 */
export interface BaseFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

