# Localization & I18n

## 1. Overview
The application is fully localized using `next-intl`. It supports dynamic runtime switching between multiple languages.
- **Scope:** UI Strings, Dates, Numbers, and **AI Content**.
- **Strategy:** URL-based localization (`/az/dashboard`) ensures SEO friendliness and shareability.

## 2. Key Directories & Files
- **Message Files:** `frameworks/next/messages/[locale].json` (The translation key-value store).
- **Config:** `frameworks/next/i18n.ts` (Request config, locale validity checks).
- **Middleware:** `frameworks/next/middleware.ts` (Redirects root `/` to `/[default_locale]/`).
- **Hooks:** `useTranslations`, `useLocale` from `next-intl`.

## 3. Architecture & Patterns

### The "Messages" Data Structure
JSON files are structured hierarchically:
```json
{
  "Auth": {
    "Login": {
      "title": "Welcome Back",
      "subtitle": "Sign in to continue"
    }
  }
}
```
Usage in Comp: `const t = useTranslations('Auth.Login'); t('title');`

### AI Localization enforcement
AI Agents (Gemini) are not localized by default. We MUST enforce this:
1.  **Capture Locale:** The UI Component passes `locale` to the API.
2.  **Instruct AI:** The Service Layer injects a *System Instruction* into the prompt: "Output in [Locale]".
3.  **Store:** Stored content (Digests) is kept in the language it was generated in.

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** extract hardcoded strings to `messages/en.json` (and others) immediately. Do not leave "To Do" comments.
- **ALWAYS** pass the user's locale to backend services (`analyzeLearningContext`, `generateQuiz`) to ensure generated content matches the UI.
- **NEVER** mix languages. If the URL says `/az`, the interface MUST be Azerbaijani.
- **DO** use `Intl.DateTimeFormat` or `next-intl`'s `format.dateTime` for dates.
- **DO** test layouts with long localized strings (e.g., German/Russian typically expand text width).
