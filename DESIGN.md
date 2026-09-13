# Design System: FinTrack

## 1. Visual Theme & Atmosphere

A restrained, utilitarian finance dashboard with warm monochrome foundations and
precise typographic hierarchy. The atmosphere is clinical yet approachable — like
a well-organized accounting ledger rendered in modern software. Data readability
is the primary concern. Every pixel serves the numbers.

- **Density:** 6 — Daily App Balanced. Comfortable spacing, not wasteful.
- **Variance:** 5 — Offset Asymmetric. Bento grids with varied card sizes, not chaotic.
- **Motion:** 5 — Fluid CSS. Spring-physics on interactions, staggered reveals on load. No cinematic scroll-jacking.

## 2. Color Palette & Roles

| Token | Hex | Role |
|---|---|---|
| Canvas | `#FAFAF9` | Primary background surface (Stone-50) |
| Surface | `#FFFFFF` | Card and container fill |
| Charcoal Ink | `#1C1917` | Primary text (Stone-900) |
| Secondary Ink | `#78716C` | Descriptions, metadata (Stone-500) |
| Muted Ink | `#A8A29E` | Placeholders, disabled (Stone-400) |
| Whisper Border | `rgba(0,0,0,0.06)` | Card borders, structural dividers |
| Strong Border | `rgba(0,0,0,0.12)` | Active/focused borders |
| Emerald Accent | `#059669` | Positive values, income, CTAs (Emerald-600) |
| Emerald Light | `#D1FAE5` | Positive badges, subtle fills |
| Rose Negative | `#DC2626` | Negative values, expenses, errors (Red-600) |
| Rose Light | `#FEE2E2` | Negative badges, subtle fills |
| Amber Warning | `#D97706` | Budget warnings (Amber-600) |
| Amber Light | `#FEF3C7` | Warning badges |

**Constraints:**
- Maximum 1 accent color (Emerald). Rose and Amber are semantic only.
- No purple, no neon, no gradients on surfaces.
- No pure black (`#000000`) — always Stone-900 or darker warm grays.
- Dark mode: Canvas `#0C0A09`, Surface `#1C1917`, borders `rgba(255,255,255,0.06)`.

## 3. Typography Rules

| Role | Font | Specs |
|---|---|---|
| Display | Geist Sans | `text-3xl md:text-4xl tracking-tight font-semibold leading-tight` |
| Body | Geist Sans | `text-base text-ink-secondary leading-relaxed max-w-[65ch]` |
| Mono / Numbers | Geist Mono | `font-mono tabular-nums` — ALL financial figures |
| Labels | Geist Sans | `text-xs uppercase tracking-wider font-medium text-ink-muted` |

**Banned:** Inter, Roboto, Open Sans, Arial, any serif font.
**Rule:** All monetary values MUST use `font-mono tabular-nums` for column alignment.

## 4. Component Stylings

### Cards (Double-Bezel)
- Outer: `rounded-card border bg-surface shadow-whisper`
- Inner padding: `p-5 md:p-6`
- Hover: `shadow-lifted` transition over 300ms with `ease-spring`
- No heavy drop shadows. No glassmorphism.

### Buttons
- Primary: `bg-ink text-white rounded-lg px-4 py-2.5 text-sm font-medium`
- Hover: `bg-stone-800` — subtle shift, no glow
- Active: `scale-[0.98] translate-y-[1px]` — tactile push
- Ghost: `text-ink-secondary hover:bg-stone-100 rounded-lg`

### Tags & Badges
- Pill shape: `rounded-full px-2.5 py-0.5 text-xs font-medium`
- Income: `bg-emerald-50 text-emerald-700`
- Expense: `bg-red-50 text-red-700`
- Warning: `bg-amber-50 text-amber-700`

### Inputs
- Label above, error below. `rounded-lg border px-3 py-2`
- Focus: `ring-2 ring-accent/20 border-accent`
- No floating labels.

### Loading States
- Skeleton shimmer matching exact layout dimensions
- No circular spinners

### Empty States
- Composed illustration + descriptive text + single CTA
- Not just "No data" text

## 5. Layout Principles

- **Grid-first:** CSS Grid for dashboard layouts. `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
- **Bento variation:** Mix `col-span-2` and `col-span-1` cards for visual interest
- **Max-width:** `max-w-7xl mx-auto px-4 md:px-6`
- **Section spacing:** `py-6 md:py-8` between dashboard sections
- **Sidebar:** Fixed left sidebar on desktop (`w-64`), collapsible on tablet, bottom nav on mobile
- **Mobile collapse:** Single column, `w-full px-4` below 768px. No exceptions.
- **Full-height:** `min-h-[100dvh]` — never `h-screen`

## 6. Motion & Interaction

- **Spring physics:** `cubic-bezier(0.32, 0.72, 0, 1)` for all transitions
- **Scroll entry:** `translateY(12px) opacity-0` → resolved over 600ms with stagger
- **Hover cards:** Shadow transition from `whisper` to `lifted` over 200ms
- **Button press:** `scale(0.98)` on `:active`
- **Staggered reveals:** Grid items enter with `animation-delay: calc(var(--index) * 80ms)`
- **Performance:** Animate only `transform` and `opacity`. No layout-triggering properties.

## 7. Anti-Patterns (Banned)

- No emojis anywhere in UI
- No Inter, Roboto, or generic system fonts
- No serif fonts in dashboard context
- No pure black (`#000000`)
- No neon glows or outer-glow shadows
- No oversaturated accent colors
- No gradient text on headers
- No 3-column equal card layouts — use asymmetric bento
- No generic placeholder names ("John Doe", "Acme Corp")
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash")
- No `h-screen` — always `min-h-[100dvh]`
- No `window.addEventListener('scroll')` — use IntersectionObserver
- No circular loading spinners — use skeleton shimmer
