# Homepage Design System

## Overview
This document outlines the design specifications for the Mouchak Cosmetics homepage, including color tone, typography, and visual hierarchy guidelines.

---

## Color Palette

### Primary Brand Color
- **Vibrant Pink**: `#e91e8c`
  - Primary action buttons, highlights, and interactive elements
  - Used for star ratings, badges, and emphasis
  - Primary CTA buttons (Buy Now, Add to Cart)

### Secondary Colors

#### Pink Shades (Complementary)
- **Light Pink Background**: `#f3e0ea`
  - Border colors for product cards (inactive state)
  - Soft hover backgrounds
- **Pale Pink Background**: `#f3c8dc`
  - Ring/outline effect for focused states
  - Light background fills
- **Very Light Pink**: `#fce7f3` (Tailwind: `bg-pink-100`)
  - Category badges
  - Light background accents

#### Neutral Grayscale
- **Dark Gray (Primary Text)**: `#1f2937` (Tailwind: `text-gray-900`)
  - Headers, primary content text
  - Main body copy
- **Medium Gray (Secondary Text)**: `#4b5563` (Tailwind: `text-gray-600`)
  - Secondary descriptions, metadata
- **Light Gray (Tertiary Text)**: `#9ca3af` (Tailwind: `text-gray-400`)
  - Disabled states, placeholders
  - Subtle UI elements
- **Very Light Gray**: `#f3f4f6` (Tailwind: `bg-gray-50` or `bg-gray-100`)
  - Card backgrounds
  - Light section backgrounds

#### Success / Status Colors
- **Emerald Green**: `#059669` (Tailwind: `text-emerald-600`, `bg-emerald-50`)
  - "In Stock" indicators
  - Success messages
  - Availability confirmations

#### Accent Colors (Rare Use)
- **Amber/Gold**: `#f59e0b` (Tailwind: `text-amber-500`)
  - Star ratings (unfilled or filled context)
- **Blue**: `#3b82f6` (Tailwind: `text-blue-500`)
  - Information badges
  - Tertiary CTAs

---

## Typography

### Font Family
- **Primary Font**: `Geist` (configured via `--font-geist-sans`)
  - Clean, modern sans-serif
  - Used for all body text, headings, and UI copy
  - Imported from `next/font/google`

- **Monospace Font**: `Geist Mono` (configured via `--font-geist-mono`)
  - Used sparingly for code snippets or technical displays
  - Not typically used in the main homepage design

### Font Hierarchy

#### Headings
| Level | Size | Weight | Color | Usage |
|-------|------|--------|-------|-------|
| **H1** | `text-4xl` (2.25rem) | **Bold (700)** | `#1f2937` | Page title, hero section headline |
| **H2** | `text-3xl` (1.875rem) | **Bold (700)** | `#1f2937` | Section headers, product category names |
| **H3** | `text-2xl` (1.5rem) | **Semibold (600)** | `#1f2937` | Subsection headers, featured product title |
| **H4** | `text-xl` (1.25rem) | **Semibold (600)** | `#1f2937` | Card titles, feature headers |
| **H5** | `text-lg` (1.125rem) | **Semibold (600)** | `#1f2937` | Feature names, inline headers |
| **H6** | `text-base` (1rem) | **Semibold (600)** | `#1f2937` | Utility headers, small emphasis |

#### Body Text
| Type | Size | Weight | Color | Usage |
|------|------|--------|-------|-------|
| **Body Lead** | `text-lg` (1.125rem) | Normal (400) | `#4b5563` | Introductory or emphasis paragraph |
| **Body Regular** | `text-base` (1rem) | Normal (400) | `#4b5563` | Main content, descriptions |
| **Body Small** | `text-sm` (0.875rem) | Normal (400) | `#4b5563` | Secondary text, helper text |
| **Body Extra Small** | `text-xs` (0.75rem) | Normal (400) | `#9ca3af` | Metadata, captions, timestamps |

#### Special Text Treatments
| Treatment | Style | Usage |
|-----------|-------|-------|
| **Semibold** | `font-semibold (600)` | Labels, prices, emphasis |
| **Bold** | `font-bold (700)` | Key metrics, important data |
| **Extra Bold** | `font-extrabold (800)` | Hero prices, major CTAs |
| **Uppercase** | `uppercase` | Category tags, badge labels (with `tracking-wider` or `tracking-[...]`) |
| **Line Through** | `line-through` | Original/compare prices in promotional context |
| **Truncate** | `truncate` + `line-clamp-*` | Long product names to prevent overflow |

### Letter Spacing
- **Tight**: `tracking-tight` (−0.015em) — Dense product names
- **Normal**: default — Regular body text
- **Wide**: `tracking-wide` (0.025em) — Action labels, category tags
- **Extra Wide**: `tracking-[0.12em]` or `tracking-[0.14em]` — Uppercase badge text (e.g., "SALE", "BEST SELLER")

---

## Visual Elements & Components

### Product Cards
```
Border: 1.5px solid #f3e0ea (hover: #e91e8c)
Border Radius: rounded-2xl
Background: white
Shadow: 
  - Inactive: 0 2px 8px rgba(233,30,140,0.04)
  - Hover: 0 12px 32px rgba(233,30,140,0.13)
Transform on Hover: translateY(-4px)
```

### Buttons (Primary CTA)
```
Background: #e91e8c
Foreground: white
Padding: px-8 py-3
Border Radius: rounded-lg or rounded-xl
Font Weight: semibold or bold
On Hover:
  - Background: darken to #c91673 or similar
  - Shadow: 0 8px 20px rgba(233,30,140,0.25)
  - Transform: translateY(-2px)
On Disabled: opacity-70, cursor-not-allowed, bg-gray-400
```

### Badges & Tags
```
Category Badge:
  - Background: #fce7f3 (pink-100)
  - Foreground: #e91e8c (pink-600)
  - Text: uppercase, xs size, tracking-wider
  - Padding: px-3 py-1
  - Border Radius: rounded-full

Discount Badge:
  - Background: #e91e8c
  - Foreground: white
  - Text: bold, font-bold uppercase
  - Padding: px-3 py-1
  - Border Radius: rounded-full
```

### Modals & Overlays
```
Backdrop: bg-black/40, backdrop-blur-sm
Modal Background: white
Border Radius: rounded-3xl (desktop), rounded-t-3xl (mobile)
Shadow: shadow-2xl
```

---

## Spacing & Layout

### Standard Spacing Scale (Tailwind)
- **Container Padding**: px-4 (mobile) → px-6 (tablet) → px-8 (desktop)
- **Section Gap**: gap-6, gap-8, gap-10
- **Card Padding**: p-4, p-5, p-6
- **Typography Spacing**: 
  - Headings: mt-3, mt-4, mb-2, mb-3
  - Body: leading-relaxed (1.625), leading-tight (1.25)

### Grid Layouts
```
Product Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
Two-Column (Details): lg:grid-cols-[1fr_1fr]
```

---

## State Management & Interactions

### Hover States
- **Cards**: Lift effect (translate Y -4px) + enhanced shadow + pink border
- **Links**: Color shift to `#e91e8c`, underline appears on hover
- **Buttons**: Background darken, shadow expand, subtle lift

### Focus States (Accessibility)
- **Form Inputs**: 
  - Border: `focus:border-[#e91e8c]`
  - Ring: `focus:ring-4 focus:ring-pink-100`
  - Background: `focus:bg-white`

### Disabled States
- **Opacity**: `opacity-70`
- **Cursor**: `cursor-not-allowed`
- **Background**: Shift to neutral gray (`bg-gray-400` or `bg-gray-300`)
- **Text**: Remains readable but muted

---

## Best Practices

1. **Color Restraint**: Use the vibrant pink sparingly for maximum impact. Rely on neutral grays for non-critical UI.
2. **Scale & Hierarchy**: Make headers large and clear. Use font weight to create emphasis without relying solely on color.
3. **Rounded Corners**: Prefer `rounded-lg`, `rounded-xl`, or `rounded-2xl` for a modern, friendly aesthetic. Avoid hard corners.
4. **Whitespace**: Allow generous padding around sections to prevent a cluttered appearance.
5. **Consistency**: Always apply the same styling rules to similar components (all product cards, all buttons, etc.).
6. **Accessibility**: Ensure sufficient color contrast. Never rely on color alone to convey information.
7. **Responsive Design**: Test all components on mobile, tablet, and desktop viewports.

---

## Example Component Snippets

### Featured Product Card with Pink Accent
```jsx
<div className="rounded-2xl border-1.5 bg-white transition-all duration-300 cursor-pointer"
  style={{
    borderColor: hovered ? '#e91e8c' : '#f3e0ea',
    boxShadow: hovered ? '0 12px 32px rgba(233,30,140,0.13)' : '0 2px 8px rgba(233,30,140,0.04)',
  }}
>
  {/* content */}
</div>
```

### Primary CTA Button
```jsx
<button className="rounded-lg bg-[#e91e8c] px-8 py-3 text-base font-bold text-white transition-all hover:bg-pink-600 hover:shadow-[0_8px_20px_rgba(233,30,140,0.25)] hover:-translate-y-0.5">
  Buy Now
</button>
```

### Category Badge
```jsx
<span className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pink-600">
  Skincare
</span>
```

---

## References
- Typography: Geist font family (Next.js integrated)
- Colors: Derived from Mouchak brand identity (#e91e8c as primary)
- Framework: Tailwind CSS (responsive utility-first styling)
