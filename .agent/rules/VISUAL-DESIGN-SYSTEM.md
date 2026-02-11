# Visual Design System

## Key Files
| File | Definition |
|---|---|
| `next/app/index.css` | Global styles — CSS variables source of truth |
| `next/tailwind.config.ts` | Tailwind theme extension, custom animations |
| `next/app/[locale]/(global)/(tiles)/` | Generic UI primitives — tiles and widgets |
| `next/app/[locale]/layout.tsx` | Font configuration (Inter, Outfit, or custom) |

## Design Aesthetic
- **Premium, Mobile-First** design system built on Tailwind CSS
- Glassmorphism, vibrant gradients (`bg-brand`), rich dark backgrounds (`bg-slate-950`)
- CSS Variables enforce consistency

## Variable Abstraction
| Variable | Purpose |
|---|---|
| `--color-brand-primary` | Main accent color |
| `--color-surface-glass` | Translucent card surface |
| `--radius-card` | Standardized border radius |

Usage in Tailwind: `bg-brand`, `text-primary`, `rounded-xl`.

## Widget Pattern
UI is built as **Widgets** — self-contained components that own their data fetching + presentation. They are "tiles" dropped into layouts, not full pages.

## Rules
- **ALWAYS** use Tailwind utility classes — no new `.css` files or `styled-components`
- **ALWAYS** use `backdrop-blur-*` + `bg-white/xx` for overlays (Glass feel)
- **NEVER** hardcode hex values in TSX — use `className="text-brand"` or Tailwind palette
- **DO** use micro-animations: `hover:scale-105`, `active:scale-95`, `transition-all`
- **DO** test responsiveness — widgets must work `w-full` (mobile) and adapt via `md:` / `lg:` breakpoints
