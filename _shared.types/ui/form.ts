// Base Form Props

export interface BaseFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// Base Modal Props

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form Mode

export type FormMode = 'create' | 'edit' | 'view';

// Select Option

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
