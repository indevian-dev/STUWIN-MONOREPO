# Navigation & Layouts

## 1. Overview
The app uses the **Next.js 14+ App Router** with a highly nested Layout architecture. This ensures that UI elements (Sidebars, Topbars, Modals) persist correctly across page transitions. Navigation is designed to be **Context-Aware**—links change based on the active Request Locale and Workspace ID.

## 2. Key Directories & Files
- **Root Layout:** `frameworks/next/app/[locale]/layout.tsx` (Global Providers: Query, Toast, Theme).
- **Workspace Layout:** `frameworks/next/app/[locale]/workspaces/(root)/layout.tsx` (The specific dashboard shell).
- **Nav Widgets:** `frameworks/next/app/[locale]/workspaces/(root)/(widgets)/` (Sidebar, Topbar).
- **Parallel Routes:** `@modal` folders for intercepting route modals.

## 3. Architecture & Patterns

### Layout Hierarchy
1.  **Root (`layout.tsx`):** `<html>`, `<body>`, Font injection, `NextIntlClientProvider`.
2.  **Auth Layout (`auth/layout.tsx`):** Centered card layout for login flows.
3.  **Workspace Root (`workspaces/layout.tsx`):** Protected boundary. Checks permissions.
4.  **Dashboard Layout (`workspaces/(root)/layout.tsx`):** Renders the Sidebar and Topbar. Contains the `{children}` slot for pages.

### Fast Navigation
We override the native `<a>` tag with Next.js `<Link>`.
- **Prefetching:** Links in the viewport are prefetched automatically.
- **Transitions:** We use `framer-motion` for page exit/enter animations (optional).

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** use the standardized `Link` component from `next-intl` (or our wrapper) to preserve the `[locale]`.
- **ALWAYS** place "Widget" components (small, isolated UI logic) in `(widgets)` folders close to where they are used.
- **NEVER** trigger full page reloads (`window.location.href`) unless absolutely necessary (e.g., logout to clear state).
- **DO** use Parallel Routes (`@modal`) for "Deep Actions" like opening an item or performing a task, so the background context remains visible.
- **DO** ensure `Sidebar` items verify `active` state against the current `pathname` to highlight the correct tab.
