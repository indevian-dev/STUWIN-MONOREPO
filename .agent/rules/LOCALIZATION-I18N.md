# Localization & I18n

## Key Files
| File | Definition |
|---|---|
| `next/i18n/messages/` | Translation key-value JSON store (per locale) |
| `next/i18n/request.ts` | Request config, locale validity checks |
| `next/proxy.ts` | Middleware — redirects root `/` to `/[default_locale]/` |
| `next/app/[locale]/layout.tsx` | Root layout with `NextIntlClientProvider` |

## Strategy
- URL-based localization (`/az/dashboard`, `/en/dashboard`)
- **Azerbaijani (az)** is the primary project language
- Uses `next-intl` for runtime switching

## Message Structure
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
Usage: `const t = useTranslations('Auth.Login'); t('title');`

## AI Localization Enforcement
1. UI passes `locale` to the API
2. Service injects System Instruction: "Output in [Locale]" into the AI prompt
3. AI-generated content stored in the language it was generated in

## Rules
- **ALWAYS** extract hardcoded strings to `messages/<locale>.json` immediately
- **ALWAYS** pass user's locale to backend AI services for content generation
- **NEVER** mix languages — if URL says `/az`, the entire interface must be Azerbaijani
- **CRITICAL:** Use **full (non-subsetted)** fonts. Subsetted fonts break Azerbaijani characters: `ə`, `ğ`, `ı`, `ö`, `ş`, `ü`, `Ə`, `Ğ`, `İ`, `Ö`, `Ş`, `Ü`
