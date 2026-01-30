import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
// No pre-defined mapping - use direct variable passing

type TranslationValue = string | number | boolean | TranslationObject;
type TranslationObject = { [key: string]: TranslationValue };
type TranslationParams = { [key: string]: string | number };

interface TranslationFunction {
  (key: string, params?: TranslationParams): string;
  raw: (key: string) => TranslationValue | undefined;
}

interface TranslationHookReturn {
  t: TranslationFunction;
  translations: TranslationObject;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to load co-located translation files
 */
export function loadClientSideCoLocatedTranslations(
  componentName: string
): TranslationHookReturn {
  const locale = useLocale();
  const [translations, setTranslations] = useState<TranslationObject>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true);

        if (!componentName) {
          throw new Error('Component name is required');
        }

        // Dynamically load the translation file based on component name and locale
        ConsoleLogger.log(`Loading translation for ${componentName} in ${locale}`);

        let translationModule;

        try {
          // Direct template literal in import - allows Webpack to statically analyze and bundle files
          translationModule = await import(`@/i18n/messages/${componentName}.${locale}.json`);
        } catch (dynamicError) {
          ConsoleLogger.warn(`Translation file not found: @/i18n/messages/${componentName}.${locale}.json`);
          ConsoleLogger.warn('Make sure the translation file exists and is properly named.');
          setTranslations({});
          setError(`Translation file not found: ${componentName}.${locale}.json`);
          return;
        }

        setTranslations(translationModule.default || {});
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        ConsoleLogger.error(`Translation loading failed for ${componentName} in ${locale}:`, err);
        // Silently fail - translations will be empty object
        setTranslations({});
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (componentName) {
      loadTranslations();
    }
  }, [componentName, locale]);

  // Translation function similar to next-intl's t function
  const t = ((key: string, params: TranslationParams = {}): string => {
    // During loading, return empty string to prevent flickering
    if (loading) {
      return '';
    }

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Only log warning when loading is complete and key is actually missing
        ConsoleLogger.warn(`Translation key "${key}" not found in co-located file for ${componentName}`);
        return key;
      }
    }

    // Simple parameter replacement
    if (typeof value === 'string' && params) {
      return Object.entries(params).reduce((str, [param, val]) => {
        return str.replace(new RegExp(`\\{${param}\\}`, 'g'), String(val));
      }, value);
    }

    return String(value);
  }) as TranslationFunction;

  t.raw = (key: string): TranslationValue | undefined => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  return { t, translations, loading, error };
}
