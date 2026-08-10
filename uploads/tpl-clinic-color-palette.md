# TPL Clinic — Color Palette & Design Tokens

**Source:** Extracted directly from [tplclinic.com](https://www.tplclinic.com) via Firecrawl's branding analysis, 10 August 2026.
**Note:** These values are auto-extracted from the site's CSS. Reliable, but worth a quick eyedropper check against a live screenshot before using for anything pixel-critical (e.g. an exact logo/hero color match).

---

## Color Palette

| Swatch | Name | Hex | Usage |
|---|---|---|---|
| 🟤 | Primary / Gold | `#B8925D` | Primary brand color |
| 🟤 | Accent / Links | `#B7915C` | Links, accent highlights (near-identical to primary) |
| 🔵 | Secondary / Navy | `#081359` | Secondary brand color |
| ⚪ | Background | `#FFFFFF` | Page background |
| ⚫ | Text (body) | `#242424` | Primary body text color |
| ⚪ | Input field background | `#FAFAFA` | Form input fills |
| ⚪ | Input border | `#A9A9A9` | Form input borders |

**Overall color scheme:** Light theme. Gold is used sparingly as an accent/link color, not as a dominant fill — background stays white/off-white with gray-toned supporting elements.

---

## Typography

| Role | Font | Fallback stack | Notes |
|---|---|---|---|
| Heading | Futura PT | Times New Roman, Times, serif | h1: 80px · h2: 21px |
| Body | Hypatia Sans Pro | Lato, futura-pt | body text: 15px |

---

## Component Style / Design System

| Token | Value | Notes |
|---|---|---|
| Corner radius | `0px` | Sharp/square corners **everywhere** — buttons, inputs, cards. Deliberate part of the clinical/editorial look. |
| Base spacing unit | `8px` | |
| Shadows | None | Flat design, no drop shadows on buttons or cards |
| Primary button | White background, `#242424` text, no shadow | Understated — not a filled/colored CTA |
| Input fields | `#FAFAFA` background, `#A9A9A9` border, square corners | |

---

## Design Personality (as read from the site)

- **Tone:** Professional
- **Energy:** Medium
- **Target audience:** Individuals seeking PRP/aesthetic treatments in London

---

## Takeaway for the Redesign

This matches what the client described on the call — light theme, gold/white/gray, gold used sparingly. Their **existing** site already treats gold as a minor accent color rather than a dominant one, so keeping gold subtle in the new hero section will be consistent with their current brand, not just a new preference.

Worth carrying the **zero-border-radius** convention into the redesign too — it's used consistently across their whole site (buttons, inputs, cards) and is a strong, easy-to-miss signal of their visual identity.
