// ═══════════════════════════════════════════════════════════════
// BASE MODAL TYPES
// ═══════════════════════════════════════════════════════════════
// Base interface for modal components - EXTEND THIS in your modals

/**
 * Base props that all modal components should extend
 * 
 * @example
 * ```typescript
 * interface StudentQuizAnalysisModalProps extends BaseModalProps {
 *   quizId: number;
 *   studentId: number;
 * }
 * ```
 */
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

