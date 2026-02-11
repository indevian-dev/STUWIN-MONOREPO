# Navigation & Layouts

## Key Files
| File | Definition |
|---|---|
| `next/app/[locale]/layout.tsx` | Root layout — `<html>`, `<body>`, fonts, `NextIntlClientProvider` |
| `next/app/[locale]/auth/layout.tsx` | Auth layout — centered card for login flows |
| `next/app/[locale]/workspaces/layout.tsx` | Workspace boundary — permission checks |
| `next/app/[locale]/workspaces/(root)/layout.tsx` | Dashboard shell — Sidebar + Topbar + `{children}` |
| `next/app/[locale]/workspaces/(root)/(widgets)/` | Widget components (Sidebar, Topbar, modals) |

## Layout Hierarchy
1. **Root** → HTML, fonts, theme providers
2. **Auth** → Centered card layout
3. **Workspace Root** → Protected boundary, permission checks
4. **Dashboard** → Sidebar + Topbar + page content

## Patterns
- `<Link>` from `next-intl` preserves `[locale]` in URLs
- Parallel Routes (`@modal`) for deep-action modals
- Widgets: self-contained components with own data fetching + presentation

## Rules
- **ALWAYS** use the `Link` component from `next-intl` (or wrapper) to preserve locale
- **ALWAYS** place widget components in `(widgets)` folders near their usage
- **NEVER** trigger full page reloads (`window.location.href`) unless necessary (e.g., logout)
- **DO** use Parallel Routes (`@modal`) for deep actions keeping background context visible
- **DO** verify `Sidebar` items highlight the correct tab via `pathname` match
