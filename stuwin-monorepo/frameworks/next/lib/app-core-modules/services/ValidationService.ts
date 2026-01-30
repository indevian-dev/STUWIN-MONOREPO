/**
 * ValidationService - Simple validation and sanitization utility
 * Used across the project routes as a lightweight alternative to larger libraries
 */

export const Rules = {
    required: (field: string) => ({
        field,
        rule: 'required',
        message: `${field} is required`,
        validator: (v: any) => v !== undefined && v !== null && v !== ''
    }),
    string: (field: string) => ({
        field,
        rule: 'string',
        message: `${field} must be a string`,
        validator: (v: any) => typeof v === 'string'
    }),
    minLength: (field: string, min: number) => ({
        field,
        rule: 'minLength',
        message: `${field} must be at least ${min} characters`,
        validator: (v: any) => typeof v === 'string' && v.length >= min
    }),
    array: (field: string) => ({
        field,
        rule: 'array',
        message: `${field} must be an array`,
        validator: (v: any) => Array.isArray(v)
    }),
    arrayMinLength: (field: string, min: number) => ({
        field,
        rule: 'arrayMinLength',
        message: `${field} must have at least ${min} items`,
        validator: (v: any) => Array.isArray(v) && v.length >= min
    }),
    oneOf: (field: string, allowed: any[]) => ({
        field,
        rule: 'oneOf',
        message: `${field} must be one of: ${allowed.join(', ')}`,
        validator: (v: any) => allowed.includes(v)
    }),
    uuid: (field: string) => ({
        field,
        rule: 'uuid',
        message: `${field} must be a valid UUID`,
        validator: (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
    }),
    email: (field: string) => ({
        field,
        rule: 'email',
        message: `${field} must be a valid email`,
        validator: (v: any) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    })
};

export const Sanitizers = {
    trim: (v: any) => typeof v === 'string' ? v.trim() : v,
    lowercase: (v: any) => typeof v === 'string' ? v.toLowerCase() : v,
    toInt: (v: any) => {
        if (v === undefined || v === null || v === '') return v;
        const parsed = parseInt(v, 10);
        return isNaN(parsed) ? v : parsed;
    },
    toBoolean: (v: any) => {
        if (typeof v === 'boolean') return v;
        if (v === 'true' || v === 1) return true;
        if (v === 'false' || v === 0) return false;
        return v;
    }
};

export const ValidationService = {
    validate: (data: any, schema: Record<string, { rules?: any[], sanitizers?: any[] }>) => {
        const errors: any[] = [];
        const sanitized: any = { ...data };

        for (const field in schema) {
            const fieldConfig = schema[field];
            const rules = fieldConfig.rules || [];
            const sanitizers = fieldConfig.sanitizers || [];

            // Sanitize
            for (const sanitizer of sanitizers) {
                sanitized[field] = sanitizer(sanitized[field]);
            }

            // Validate
            for (const rule of rules) {
                if (!rule.validator(sanitized[field])) {
                    errors.push({
                        field,
                        rule: rule.rule,
                        message: rule.message
                    });
                    break; // Stop at first error for this field
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            firstError: errors[0],
            sanitized
        };
    }
};
