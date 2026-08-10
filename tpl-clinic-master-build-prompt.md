# TPL Clinic — Asset Prep Report + Master Build Prompt for Google Antigravity

## 1. What I checked

**The video:** `tpl-clinic-hero-video-final.mp4` — 1920×1080, h264, 18.6s, 23.976fps, 38.9MB. Confirmed intact and playable via ffprobe.

**The design:** `TPL Clinic Landing Page/TPL Clinic.dc.html` — your Claude-generated design is real, structured, and already anticipates a scroll-driven frame sequence. It already has:
- A `[data-hero]` section set to `460vh` (adjustable 260–720vh via a `heroScrollDepth` prop) with a `position: sticky` inner stage — the standard Apple-style pinned-scroll pattern.
- A working scroll-progress engine (`p`, 0→1) already wired to fade/scale a central "viewfinder" card (`[data-parallax]`), fade the intro copy, and step through **four region panels** — FACE / HAIR / BODY / PLASMA — as you scroll, exactly matching the face/hair/body/diagnostics structure from the brief.
- A literal placeholder inside that viewfinder card: *"DROP MP4 / IMAGE SEQUENCE HERE · 1920×1080 · 24FPS"* with a live frame counter (`[data-frame]`) already counting 0001→0480 off the scroll position.
- One real bug: nav links to `#body`, but there's no `id="body"` section anywhere in the file — that anchor currently goes nowhere. Flagged for Antigravity to fix below.

This means the hero video doesn't go full-bleed — it plays **inside that bordered central card**, while the FACE/HAIR/BODY/PLASMA background text cycles behind it. That's a more distinctive treatment than a generic full-bleed video, and I kept the master prompt faithful to it rather than flattening it.

I also corrected the placeholder's frame count from 480 to 150 directly in the file (with the reasoning for that number below) so the design and the real asset count agree from the start.

## 2. What I did with the video and images

### Hero: video → 150-frame WebP sequence (canvas-scrubbed, not `<video>`)

Real scroll-scrubbing (frame position tied to scroll position, not to time) can't be done reliably with a `<video>` element — seeking a video frame-by-frame on scroll is slow and stutters, especially on mobile. Every major implementation of this effect (Apple's product pages included) instead decodes a sequence of still images and draws the current one to a `<canvas>` on each scroll tick. I extracted your video into that format:

- **150 frames**, evenly sampled across the 18.6s clip, WebP format, same 1920×1080 as the source — **no resolution or quality reduction**, just fewer redundant in-between frames (Apple's own product-page sequences typically run ~140–150 unique frames for a comparable scroll length, so this matches real-world practice, not a corner cut).
- WebP over PNG: same visual quality, roughly **90% smaller** per frame. WebP over JPEG or AVIF specifically for this use case: WebP decodes faster than AVIF, which matters here because the browser has to decode many images in quick succession while you scroll — decode speed, not just file size, is what prevents lag.
- Result: **150 files, 8.96MB total, ~61KB average per frame** (down from what would have been several hundred MB as raw PNG frames).

Saved to: `TPL Clinic Landing Page/assets/hero-frames-webp/frame-0001.webp` → `frame-0150.webp`

### Instant paint: poster + LQIP

- `assets/hero-poster/hero-poster.webp` — frame 1, shown immediately, before any JavaScript runs or any sequence frame has loaded.
- `assets/hero-poster/hero-lqip.webp` — a 24px-wide, 106-byte blurred version of frame 1, small enough to inline directly in the HTML as a base64 background so something meaningful paints before *any* network request completes. This is the same trick used for hero images on most large e-commerce and marketing sites.

### Mobile / reduced-motion fallback

Decoding and drawing 150 canvas frames during a scroll gesture is fine on a laptop GPU; it is a common source of jank on phones. Real implementations branch here rather than serving the same asset everywhere, so I prepared two fallbacks:

- `assets/hero-fallback/hero-mobile.mp4` — 960px wide, H.264, ~2.2MB, muted, for a simple autoplaying loop on small screens instead of the canvas sequence.
- `assets/hero-fallback/hero-desktop.mp4` — full-resolution, recompressed to ~14MB (from 38.9MB) at a more web-appropriate bitrate, available as a fallback if a browser can't do the canvas approach at all (rare, but cheap insurance).
- For anyone with `prefers-reduced-motion: reduce` set, neither video nor the frame sequence should play — just the static poster, no motion at all. This is an accessibility requirement, not a nice-to-have, and the master prompt below makes it explicit.

### Section images: your 9 generated stills, converted and reused (no new generations needed)

Converted all 9 of your original PNGs (2.4–4.4MB each, 26.3MB total) to WebP at quality 85 (1.1MB total — a 96% reduction with no visible quality loss at these dimensions). Then created clearly-named copies for direct use in the site's content sections:

- `assets/section-images-webp/section-face.webp` (from frame-03-into-the-face)
- `assets/section-images-webp/section-hair.webp` (from frame-05-into-the-hair)
- `assets/section-images-webp/section-body.webp` (from frame-07-into-the-torso)
- `assets/section-images-webp/section-prp.webp` (from frame-08-to-the-arm — doubles as the diagnostics/PRP section image)
- `assets/section-images-webp/section-clinic-portrait.webp` (from frame-01-establishing — a spare full-figure shot, available if a section wants a calmer/general portrait)

**You do not need to generate any new images for the Face, Hair, Body, or PRP content sections** — the existing set already covers all four. The one gap: the **Clinic/location section** currently has no visual asset at all, and none of your 9 generated frames are appropriate for it (they're all the invented model, not the actual Mayfair premises). If that section is meant to show the real clinic, you'll want either a real interior/exterior photo of 22 Seymour Street or to keep that section text-only — flagged for Antigravity to ask about rather than guess.

## 3. Total asset footprint

| Folder | Size | Contents |
|---|---|---|
| `assets/hero-frames-webp/` | 8.96MB | 150 WebP frames, hero scroll sequence |
| `assets/hero-poster/` | 36KB | Poster + LQIP |
| `assets/hero-fallback/` | 18MB | Mobile + desktop MP4 fallbacks |
| `assets/section-images-webp/` | 1.1MB | 9 converted stills + 5 named section copies |
| **Total** | **~29MB** | Full package |

For comparison: the original 9 PNGs plus the raw MP4 alone were already ~65MB, and that's before even attempting a frame sequence. Nothing here compromises on visual quality — the savings come entirely from format choice (WebP), removing redundant near-duplicate frames, and giving different devices different assets rather than sending everyone the heaviest version.

---

## 4. Master Prompt — paste this into Google Antigravity

```
Build the TPL Clinic landing page using the existing design file `TPL Clinic Landing Page/TPL Clinic.dc.html` as the single source of truth for layout, copy, structure, colors, and typography. Do not redesign it — extend and wire it up. Treat `support.js` as the existing behavior layer to build on, not replace.

DESIGN SYSTEM (already established in the file — preserve exactly):
- Colors: primary gold #B8925D, secondary navy #081359 (use sparingly), background #FFFFFF, body text #242424, input fill #FAFAFA, input border #A9A9A9.
- Fonts: Jost (headings/UI, weights 200–500), Lato (body text), JetBrains Mono (HUD/technical labels like the frame counter).
- Zero border-radius everywhere — square corners on every button, input, and card. This is a deliberate brand signal, not an oversight.
- No drop shadows anywhere. Flat design throughout.
- Gold is an accent color only — links, thin dividers, small labels. Never a dominant fill.

TASK 1 — Wire up the hero scroll sequence (highest priority):
The hero section (`[data-hero]`, currently 460vh, sticky-pinned inner stage) already has a scroll-progress engine computing `p` from 0 to 1 in `support.js`'s `update()` method. Inside the central bordered "viewfinder" card (`[data-parallax]`), replace the current placeholder content (the "DROP MP4 / IMAGE SEQUENCE HERE" instructional text) with a `<canvas>` element that fills that card's bounds. Keep the existing `[data-frame]` counter text as a live HUD readout overlaid on the canvas — it's a nice authentic touch, don't remove it, just make sure it sits above the canvas visually.

Implement canvas-based frame scrubbing, NOT a <video> element with currentTime seeking — video seek-scrubbing is unreliable and janky on scroll, especially on mobile; canvas-drawn image sequences are the standard approach for this effect (this is how Apple's product pages do it).

Frame assets: `assets/hero-frames-webp/frame-0001.webp` through `frame-0150.webp` (150 total, zero-padded to 4 digits, 1920×1080 WebP).

Implementation requirements:
1. On load, immediately paint `assets/hero-poster/hero-poster.webp` (frame 1) to the canvas so there's instant visual content — don't wait on any sequence frames.
2. Preload frames 1–20 eagerly (blocking-ish, high priority) so the first ~13% of scroll is always smooth even on a fast scroller. Stream the remaining frames 21–150 progressively in the background using `requestIdleCallback` (with a `setTimeout` fallback for Safari) so it never blocks initial interactivity.
3. Decode each frame via `createImageBitmap()` and cache all decoded bitmaps in an array indexed 1–150 — never decode the same frame twice, and never block the scroll handler on a decode.
4. On each scroll tick (already throttled via `requestAnimationFrame` in the existing `onScroll`/`update()` pattern — reuse it, don't add a second scroll listener), compute `targetFrame = Math.max(1, Math.round(p * 150))`, then draw `Math.min(targetFrame, highestFrameLoadedSoFar)` — i.e. if the user scrolls faster than frames have streamed in, hold on the most recent available frame rather than showing a blank canvas or throwing an error. Never let the canvas go empty.
5. Size the canvas to the `[data-parallax]` card's actual rendered box (`min(46vw,620px)` × `min(78vh,780px)`) at `window.devicePixelRatio` for sharpness, and draw each frame with `object-fit: cover` behavior (compute scale/offset manually — canvas doesn't have native object-fit) so frames fill the card without distortion.
6. Update the frame counter text on the same tick using the same `targetFrame` value, format `FRAME 000X / 0150`.

TASK 2 — Device and accessibility branching (do this before Task 1's canvas code runs, as a gate):
- If `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true: skip the canvas sequence and the scroll-pin entirely. Show only the static `hero-poster.webp` as a normal, non-pinned, roughly 100vh hero. No scroll-driven motion of any kind for these users — this is an accessibility requirement, not optional.
- Else if viewport width < 768px (or `navigator.connection?.saveData` is true, or `navigator.connection?.effectiveType` is '2g'/'3g'): skip the canvas frame sequence and instead autoplay, loop, and mute `assets/hero-fallback/hero-mobile.mp4` inside the same viewfinder card. Decoding 150 canvas frames during touch-scroll is a common jank source on phones; a small looping video is far cheaper there.
- Else (desktop, no reduced-motion): run the full canvas sequence from Task 1.

TASK 3 — Resource hints and loading priority:
- `<link rel="preload" as="image" href="assets/hero-poster/hero-poster.webp" fetchpriority="high">` in the document head.
- Inline the LQIP (`assets/hero-poster/hero-lqip.webp`, already tiny — base64-encode it) as a CSS background on the viewfinder card so something paints before even the poster request completes.
- All below-the-fold section images load with `loading="lazy"` and `fetchpriority="low"`, and use explicit `width`/`height` attributes (or `aspect-ratio` CSS) matching their real dimensions so nothing shifts layout as it loads (CLS).
- Frame sequence background-streaming (frames 21–150) should never compete with above-the-fold resource loading — keep it at idle/low priority as specified in Task 1.

TASK 4 — Wire the section images (no new image generation needed — all assets already exist):
- Face section (`#face`): `assets/section-images-webp/section-face.webp`
- Hair section (`#hair`): `assets/section-images-webp/section-hair.webp`
- Body section: `assets/section-images-webp/section-body.webp` — NOTE: there is currently no `id="body"` section in the file even though the nav bar links to `#body` (both the top nav and a secondary nav reference `href="#body"`). This is a broken anchor in the current design. Add a Body/torso content section in the same visual pattern as the existing Face/Hair/PRP sections (same typography, same spacing rhythm, same copy structure — headline, one-line description, list of relevant treatments from the tech index), using `section-body.webp` as its image, and give it `id="body"` so the nav resolves correctly.
- PRP/diagnostics section (`#prp`): `assets/section-images-webp/section-prp.webp`
- If there's a general/about use for an extra full-figure shot, `assets/section-images-webp/section-clinic-portrait.webp` is available, but don't force it in if it doesn't fit.
- Do NOT use any AI-generated model imagery for the Clinic/location section — ask before adding anything there. That section should either use a real photo of 22 Seymour Street, Mayfair if one is provided, or stay text/address-only.

TASK 5 — Format and delivery for all images site-wide:
- Serve every image as WebP — no PNG or unconverted JPEG in the final build. All source assets have already been converted; use the `.webp` files provided, not the original `.png` files sitting alongside them.
- Do not add a JPEG fallback chain via `<picture>` — WebP has full support across all evergreen browsers (Safari included, since Safari 14) and adding a fallback format only adds weight for effectively zero real-world benefit in 2026.
- Respect the existing `revealAnimations` prop and `[data-reveal]` IntersectionObserver pattern already in `support.js` for section entrance animations — don't introduce a second animation system.

TASK 6 — Testimonials and scope guardrails (per the client brief, do not deviate):
- No testimonials anywhere on the page — they were explicitly removed by client request during the redesign scope discussion.
- No AI voice agent, no chatbot, no automated booking flow — booking stays the existing manual phone/WhatsApp/consultation-deposit flow already reflected in the design's CTA buttons and WhatsApp link. Do not add any new booking automation.
- Keep the existing consultation form behavior (`state.submitted`, the confirmation modal) exactly as built — this matches the client's explicit "keep contact form as-is" requirement.

TASK 7 — Performance target and verification:
- First Contentful Paint should not wait on any hero sequence frame beyond frame 1 (the poster).
- Total JavaScript-initiated network weight in the first 3 seconds should be under ~500KB (poster + LQIP + first ~20 hero frames + critical fonts) — everything else streams in afterward.
- Test scroll performance by scrolling the hero section rapidly from top to bottom multiple times in a row — the canvas should never show a blank/gray frame and should never drop below the most-recently-loaded frame, even on a fast scroll-fling.
- Test with `prefers-reduced-motion` forced on in devtools and confirm zero motion plays.
- Test at a throttled "Fast 3G" network profile and confirm the poster still appears within ~1 second.

Build this as a complete, production-ready single page matching the existing `.dc.html` structure, styling, and copy exactly — the only new work is the canvas hero implementation, the device/accessibility branching, the missing Body section, and wiring the section images. Do not alter existing copy, colors, fonts, or the consultation form logic.
```
