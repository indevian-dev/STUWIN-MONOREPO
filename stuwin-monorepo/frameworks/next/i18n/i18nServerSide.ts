import fs from 'fs';
import path from 'path';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
/**
 * Server-side co-located translation loader
 * For use in Server Components and Server Actions
 */

type TranslationValue = string | number | boolean | TranslationObject;
type TranslationObject = { [key: string]: TranslationValue };
type TranslationParams = { [key: string]: string | number };

interface TranslationFunction {
  (key: string, params?: TranslationParams): string;
  raw: (key: string) => TranslationValue | undefined;
}

/**
 * Load co-located translation file synchronously
 * @param componentName - Name of the component (without extension)
 * @param locale - Locale code (e.g., 'en', 'az')
 * @returns Translation object
 */
export function loadCoLocatedTranslations(
  componentName: string,
  locale: string
): TranslationObject {
  try {
    // Directly construct file path based on component name and locale
    const translationFile = path.join(
      process.cwd(),
      'i18n',
      'messages',
      `${componentName}.${locale}.json`
    );

    // Read and parse the translation file
    const fileContent = fs.readFileSync(translationFile, 'utf8');
    const translations = JSON.parse(fileContent) as TranslationObject;

    ConsoleLogger.log(`Server: Loaded translations for ${componentName} in ${locale}`);
    return translations;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    ConsoleLogger.warn(
      `Server: Failed to load translation for ${componentName} in ${locale}:`,
      errorMessage
    );
    ConsoleLogger.warn(
      `Server: Make sure the file /i18n/messages/${componentName}.${locale}.json exists`
    );
    return {};
  }
}

/**
 * Create a translation function for server components
 * @param translations - Translation object
 * @returns Translation function similar to next-intl's t
 */
export function createServerTranslator(
  translations: TranslationObject
): TranslationFunction {
  const t = ((key: string, params: TranslationParams = {}): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        ConsoleLogger.warn(`Translation key "${key}" not found in co-located file`);
        return key; // Return key as fallback
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

  return t;
}

/**
 * Get translations for a component (convenience function)
 * @param componentName - Name of the component
 * @param locale - Locale code
 * @returns Translation function
 */
export function loadServerSideCoLocatedTranslations(
  componentName: string,
  locale: string
): TranslationFunction {
  const translations = loadCoLocatedTranslations(componentName, locale);
  return createServerTranslator(translations);
}
