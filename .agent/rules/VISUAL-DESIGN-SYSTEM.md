# Visual Design System

## 1. Overview
We utilize a **Premium, Mobile-First** design system built on **Tailwind CSS**. The aesthetic focuses on "Glassmorphism", vibrant gradients (`bg-brand`), and deep rich backgrounds (`bg-slate-950`) for dark mode support. Consistency is enforced via **CSS Variables** defined in `index.css`.

## 2. Key Directories & Files
- **Global Styles:** `frameworks/next/app/index.css` (The Source of Truth for variables).
- **Tailwind Config:** `frameworks/next/tailwind.config.ts` (Theme extension, custom animations).
- **UI Components:** `frameworks/next/components/` (Generic primitives: Button, Input, Card).
- **Fonts:** Configured in `app/layout.tsx` (Inter, Outfit, or custom fonts).

## 3. Architecture & Patterns

### The Variable Abstraction
Instead of hardcoding colors like `bg-blue-500`, we use semantic variables mapping:
- `--color-brand-primary`: The main accent color.
- `--color-surface-glass`: The translucent white/black for cards.
- `--radius-card`: Standardized border radius.

Usage in Tailwind: `bg-brand`, `text-primary`, `rounded-xl`.

### "Widgetization"
UI is built as **Widgets**: self-contained components that own their data fetching and presentation.
- Example: `DomainEntityProgressWidget.tsx`
- It is NOT a "Page". It is a "Tile" dropped into a Layout or Page.

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** use Tailwind utility classes. Do not create new `.css` files or use `styled-components`.
- **ALWAYS** use `backdrop-blur-*` and `bg-white/xx` usage for overlays to maintain the "Glass" feel.
- **NEVER** hardcode hex values (`#FF5733`) in TSX files. Use `className="text-brand"` or `text-red-500`.
- **DO** Implement "Micro-Animations" using `hover:scale-105`, `active:scale-95`, and `transition-all` on interactive elements.
- **DO** check responsiveness. Every widget must work on `w-full` (mobile) and adapt to grid slots on `md:` and `lg:`.
