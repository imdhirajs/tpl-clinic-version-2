# TPL Clinic Website — Technical Documentation

Live site: https://tpl-clinic-version-2.netlify.app
Hosting: Netlify (project `tpl-clinic-version-2`)
Repo: `github.com/imdhirajs/tpl-clinic-version-2` (branch `v2`)

This document explains what the site is built from, what was changed, why, and how — so anyone picking this project up later (including future-you) doesn't have to reverse-engineer it.

---

## 1. Who built what

- **Homepage / hero section (`index.html`)** — built from scratch, including the scroll-driven animation engine, the loading screen, and the homepage copy.
- **All other pages** (`about.html`, `services.html`, `prp.html`, `sofwave.html`, `gdpr.html`, `terms-conditions.html`) — originally built by a collaborator (Prathamesh) in a separate project folder, then brought into this project, wired up, and fixed/optimized to match the homepage.

---

## 2. Tech stack

- **Plain HTML/CSS/JavaScript** — no framework (no React/Vue/etc.), no build step. Every page is a static `.html` file.
- **A custom lightweight templating convention** — `x-dc` / `helmet` tags, `{{ expression }}` bindings, `onClick="{{ handler }}"`, `style-hover="..."` — all interpreted at runtime by a shared script, `assets/js/support.js`. This is the same runtime shared by every page.
- **Lenis** — smooth-scroll library. Used to drive the hero scroll animation and to gate scrolling during the loading screen.
- **ImageKit** — CDN used to host and serve the hero animation frames, with on-the-fly image transformation (compression, format, resizing) done via URL parameters rather than pre-generating every size by hand.
- **Netlify** — hosting and deployment (`netlify deploy --prod`).
- **ffmpeg** (via the Python `imageio_ffmpeg` package) — used to re-encode the Sofwave treatment video.
- **Pillow** (Python) — used to fix and re-encode the About Us team photos.

---

## 3. The homepage hero animation

This is the most technically involved part of the site.

**Concept:** as the visitor scrolls, a full-screen video-like sequence plays — but it's not a video file. It's a canvas element that draws a different still frame for every pixel of scroll, so the "playback" is scroll-scrubbed (scroll up = animation reverses, scroll fast = animation fast-forwards, exactly like Apple's product pages).

**How the frames are delivered:**
- The full sequence is 1,000 individual frames.
- Frames are packed 4-to-a-sheet (a 2×2 grid) into 250 sprite sheet images, to cut down the number of separate files the browser has to request.
- Each sheet is 3840×2160px (so each individual frame cell is 1920×1080).
- Sheets are hosted on ImageKit at `assets/hero-sprites-hd/sprite-hd-XXX.webp`.
- ImageKit's URL parameters (`tr=q-75,f-auto`) compress each sheet and let the browser negotiate the best format (WebP/AVIF) automatically, instead of shipping one fixed format to everyone.
- For sheets fetched dynamically by JavaScript (not the initial `<link rel="preload">` tags), the code also picks a **width tier** (1920 / 2880 / 3840px) based on the visitor's actual screen width and pixel density, so a laptop doesn't download the same oversized sheet a 4K display needs. The math accounts for the fact that a sheet is 2 cells wide, so the "ideal" sheet resolution is 2× the on-screen cell size — an earlier version of this logic got that doubling wrong and defaulted everyone to the largest tier; that's fixed.

**Loading screen (the part most relevant to "why does it wait a few seconds"):**
- On first visit, the page shows a full-screen splash (logo, live "XX%" counter, thin progress line) and **locks scrolling** (`Lenis.stop()` + `overflow:hidden` on the page).
- While that's showing, the code preloads a skeleton set of sprite sheets spanning the whole sequence in the background.
- Once enough is loaded, the splash fades out and scrolling unlocks.
- There's an 8-second safety timeout, so if a connection is unusually slow, the visitor is released anyway rather than being stuck staring at a loading screen forever.
- **This is intentional, and it's the same pattern high-end sites (Apple, Awwwards-tier agency sites) use for scroll-driven animation.** The alternative — letting people scroll immediately — means a first-time visitor scrubs ahead of what's actually downloaded, and the animation stutters and shows blank/wrong frames. The loading screen trades a short, obvious wait for a scroll experience with zero stutter afterward. It only happens once per visitor per browser session — after the first load, the browser caches the sprites and there's no wait on return visits.

**Text overlay per scene:** the hero has 8 narrative beats (Reception, Consultation, Diagnostic, Hair Treatment, Body Treatment, Hair Transplant, Products, Brands). Each beat has a verified-safe frame range (checked against the actual downloaded footage, not assumed) and a specific on-screen position/alignment chosen so the caption never overlaps the left-hand progress rail or a visually busy part of that particular frame. Hair Transplant needed two separate frame ranges instead of one, because that shot goes wide → close-up → wide, and the close-up frames don't have a safe area for text.

---

## 4. Navigation

- Simplified to exactly three items across **all seven pages**: **Home / Services / About Us**. (Previously there were also "Treatments", "PRP Method", "Technology", "Mayfair Clinic" as separate top-level items — removed; their content is still reachable via footer links and in-page anchors, just not as top nav items.)
- The **Services mega-menu** (the full treatment catalogue — 20 treatments) is now available from the homepage and every page, not only after clicking into About Us.
- **Mobile nav drawer** is rebuilt at runtime by `assets/js/tpl-mobile.js` — it clones the treatment groups out of whatever matches `.tpl-mega-menu > div` or `.tpl-services-mega > div` in the page and builds the mobile menu from that. This script's template had to be rewritten to match the new simplified nav, and its selector had to be extended, because the homepage's services panel uses a different CSS class than the other pages did.
- Footer "Terms & Conditions" / "GDPR & Privacy Policy" links were pointing nowhere (`#top`) — fixed to link to the actual pages.

---

## 5. Mobile optimization

- **Overflow bug fix:** several elements (About Us team-bio cards, the "Send Enquiry" buttons) used `width:100%` plus inline padding with no `box-sizing:border-box` anywhere in the CSS. By default, browsers add padding *on top of* a declared width (`content-box` sizing), so the actual rendered box was wider than its container — text and buttons were visibly overflowing/clipping. Fixed by adding `box-sizing:border-box` to the affected elements.
- **Tap targets:** bumped several nav/link tap targets up to a 44px minimum height, matching the accessibility guideline Apple/WCAG use for comfortable mobile tapping.

---

## 6. Image optimization

- About Us team photos (9 images) were found to be mislabeled — the files had a `.jpg` extension but were actually WEBP data internally. Renamed correctly, re-saved through Pillow at quality 88.
- Added responsive `srcset` (a smaller 500px-wide variant alongside the full-size one) with a `sizes` attribute, so mobile browsers download the smaller file instead of the full desktop-size image.
- Added `loading="lazy"` and explicit `width`/`height` attributes on these images, so the browser doesn't shift the layout while they load in.

---

## 7. Video optimization (Sofwave treatment page)

**Before:** a single 6.4MB H.264 MP4, 1280×720, 75 seconds, no audio track, ~670kbps.

**Diagnosis:** checked whether the file was structured for fast web streaming ("faststart" — metadata at the front of the file rather than the end); it already was, so that wasn't the cause of the slow-start. The remaining cause was simply that the file was larger than it needed to be for the compression efficiency available today.

**What was done:** re-encoded the **full 75 seconds — no content cut, nothing trimmed** — into two versions:
- `sofwave-treatment.webm` (VP9 codec) — 4.08MB, about 36% smaller
- `sofwave-treatment.mp4` (H.264, more efficient encode settings than the original) — 4.26MB, about 33% smaller, kept as a fallback for browsers that don't support WebM (mainly older Safari)

The `<video>` tag now lists the WebM source first and the MP4 second — browsers automatically use the first format they support, so modern browsers get the smaller file and older ones still work.

The original file is kept alongside as `sofwave-treatment-original-backup.mp4` in case it's ever needed again.

**Verified result:** locally, the new video reaches a fully-buffered, playable state in about 1 second, versus a multi-second visible stall before.

---

## 8. Copy / content

Section headlines and subtitles for the hero sequence and elsewhere were rewritten to actually match what's shown in the footage at that point in the scroll (earlier labels didn't match the real content), and written with an aesthetic-clinic marketing voice rather than generic placeholder copy.

---

## 9. Deployment

```bash
netlify deploy --prod --dir=.
```
Run from inside the `TPL Clinic Landing Page` folder (already linked to the Netlify site via `.netlify/state.json`).

---

## 10. Known open items / not yet done

- An earlier performance pass flagged that `index.html` has some render-blocking scripts in `<head>`. This was **not** changed yet — it needs to be tested carefully rather than changed blind, since the hero engine's script load order matters. Worth revisiting in a future pass if further speed gains are wanted.
- No other outstanding issues at time of writing — everything else described above is live.

---

## 13. Scroll smoothness pass (2026-08-29)

Reported symptom: scrolling felt laggy in Safari, and then also in Chrome (including a fresh incognito window, so not a cache or extension issue). The page loaded fine — the lag was in the scrolling itself, and it followed the scroll all the way down the page, not just through the hero animation.

Four separate causes were found and fixed. All four were *per-frame* costs: work the browser had to redo on every single animation frame while the page moved.

**1. Forced synchronous layout on every frame (measured: ~2.3ms/frame).**
`renderFrame()` read `hero.offsetHeight`, `consultation.offsetTop/offsetHeight`, `footer.offsetTop/offsetHeight`, `window.innerHeight` and a `getBoundingClientRect()` on every scroll tick. Reading any of those forces the browser to stop and recompute layout *immediately* if anything has been styled since the last layout — and the previous frame had just written inline styles, so it always had. That is roughly 14% of a 60fps frame budget spent before a single pixel was drawn.
None of those numbers change while scrolling. They are now measured once (`measureLayout()`), re-measured on resize and a few times after load, and served from cache. Verified with instrumentation: a full 2000px hero scroll now performs **0** `offsetTop` / `offsetHeight` / `getBoundingClientRect` reads (previously one full set per frame).

**2. The sequence rail rewrote itself every frame.**
The 8-item rail set `opacity` on each item plus `background` and `height` on each bar — 24 inline style writes — on every frame, even when the active beat had not changed. Now gated on the beat actually changing.

**3. `backdrop-filter` re-blurring over moving content.**
- The award badge and the frame counter sit *on top of* the hero canvas and both had a `backdrop-filter` blur. Since the canvas repaints every frame, the compositor had to re-read and re-blur those regions every frame too. Both already had a 85–88% opaque white background, so the blur behind them was contributing almost nothing visually — removed, and the backgrounds nudged to 92–94% to compensate. Visually identical.
- The fixed header carried `will-change: backdrop-filter` (which keeps a live blur layer over *all* scrolled content for the whole session) and `transition: backdrop-filter .35s` (which re-runs the blur pass on every intermediate frame of the change). Both removed. The blur itself was reduced from `blur(20px) saturate(180%)` to `blur(12px)` — `saturate()` on top of `blur()` is a second full filter pass. The frosted look is preserved.

**4. The canvas was always one frame behind the scroll.**
Lenis moved the page inside its own `requestAnimationFrame` loop; the app listened for the resulting native `scroll` event and then scheduled *another* `requestAnimationFrame` to draw. So the image was consistently ~16ms behind where the page actually was — the picture visibly trailing the gesture. The render is now driven directly from Lenis's own scroll callback, so it lands in the same frame. The native path is kept as a fallback (keyboard scrolling is not driven by Lenis) and is deduplicated by an unchanged-position guard.

**Bug found and fixed along the way:** the `ticking` flag used to throttle the scroll handler to one pass per frame was a one-way latch. A `requestAnimationFrame` callback is *not* guaranteed to run — the browser drops it when the tab is backgrounded, and can skip it under load. If that callback never fired, `ticking` stayed `true` and **every subsequent scroll returned early: the hero froze on whatever frame it was on and never recovered.** Reproduced directly — background the tab mid-hero, come back, and the sequence is dead. Fixed with a timeout that releases the latch if the frame never arrives, plus a `visibilitychange` handler that re-syncs the sequence when the tab comes back. The same latch bug existed in the sub-pages' nav handler and was fixed there too.

**Applied to:** `index.html` (all four, plus the freeze fix) and all six sub-pages (`about`, `services`, `prp`, `sofwave`, `gdpr`, `terms-conditions`), whose `applyNavTheme()` rewrote roughly a dozen inline styles — `backdrop-filter`, `box-shadow` and `padding` among them — on every scroll frame regardless of whether the theme had changed. It now bails out when the resolved state is unchanged, which removes the writes *and* makes the following frame's `getBoundingClientRect` reads cheap, since nothing dirtied layout.

---

## 14. Start-frame sharpness + further Safari work (2026-08-29, second pass)

Reported: still laggy in Safari, and the **starting frame looks blurry** compared to Chrome.

### The blurry start frame — found and fixed

Ruled out first, by measurement rather than assumption:
- **Not a format difference.** ImageKit's `f-auto` returns byte-identical WebP (116,508 bytes) to both a Chrome and a Safari `Accept`/UA. Checked with `curl`.
- **Not compression.** Re-fetched sheet 1 at `q-75`, `q-85`, `q-92` and raw. Against the 4K poster of the same frame, PSNR was 32.79 / 32.84 / 32.88 / 32.77 dB — i.e. **quality level makes no measurable difference**. Raising `q` would have cost bandwidth for nothing.

The actual cause: **the resting frame was drawn from a sprite cell, not from the 4K poster.**
- `assets/hero-poster/hero-poster.webp` is a full **3840×2160** render of frame 1, downloaded on every page load.
- It was only ever used as a *fallback* for "no sprite loaded yet". The moment sheet 1 arrived, `drawSingleFrame(1)` switched to the sheet's top-left **1920×1080** cell — which then has to be upscaled ~1.5–1.6× to fill a Retina canvas (2880×1424 on a 1440px window at DPR 2). **So the picture got softer a second or two after load.**
- Measured on the real assets, at the real canvas size: detail (Laplacian variance) **87.2 for the poster path vs 46.4 for the sprite path — 1.9× sharper.**

Fixed by preferring the poster whenever the sequence is on frame 1. Verified without relying on eyeballs: a canvas that has drawn a cross-origin ImageKit sprite becomes **tainted**, so `getImageData` throws. On the old build the resting canvas threw (→ it was painting the ImageKit sprite); on the new build it does not (→ it is painting the local poster). Frames 2+ are unchanged — the poster only exists for frame 1.

### `image-rendering: crisp-edges` on the canvas — removed

The canvas carried `image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;`. These request **non-smooth** (nearest-neighbour-style) scaling of the canvas element. At an exact 1:1 backing-store-to-device-pixel ratio they do nothing — but on a Mac running a **scaled display mode** (the default on most MacBooks) or with any browser zoom, the canvas sits at a fractional scale, and **WebKit honours `-webkit-optimize-contrast` where Chrome largely does not.** Same bytes, different picture. That is a plausible cause of "worse in Safari than Chrome" specifically, so it is gone; the browser now resamples smoothly.

### Safari lag — two further changes

Both target documented WebKit-specific behaviour, and both are honest guesses rather than measurements, because **Safari cannot be driven from this environment** (browser automation here is Chrome-only, and computer-use grants browsers read-only access).

1. **Decode race widened 1500ms → 3000ms.** Each sheet is published to the cache via `img.decode()` raced against a timeout. If the timeout wins, the image is published **undecoded**, and the next `drawImage` has to decode a 3840×2160 sheet *synchronously on the main thread, mid-scroll*. Chrome usually decodes a 4K WebP inside 1.5s and wins the race; Safari often does not — which turns the safety net into a regular source of hitches. (Note: git history shows this was 3s at one point and had regressed to 1.5s.)
2. **Decoded-bitmap budget cut for WebKit only: 1GB → 640MB** (~32 sheets → ~19). Section 3's existing notes already record that WebKit thrashes rather than evicting cleanly under decoded-bitmap pressure, where Chrome copes. Chrome keeps the 1GB budget. The fetch-ahead window is 12 sheets, so 19 still leaves headroom both sides of the playhead.

Plus a micro-fix: `imageSmoothingQuality` was assigned on *every* draw; assigning it invalidates cached graphics state in WebKit. It is now only written when the value changes, with the memo invalidated on canvas resize (resizing a canvas resets its 2D context state).

### If Safari is still not smooth

The next lever — deliberately **not** pulled, because it trades away sharpness right after a sharpness complaint — is the canvas backing store. It is currently `cssWidth × min(devicePixelRatio, 2)`, so on a Retina Mac the 1920-wide sprite source is being upscaled ~1.5× into a 2880-wide canvas. Safari's Canvas2D scaling cost tracks **destination** pixel count, so capping the backing store nearer the source (e.g. 2160 wide) would cut per-frame draw cost roughly 40% for pixels that carry no extra real detail. The cost is a slightly softer sprite-frame image, since the GPU would then do a second (bilinear) upscale to the display.

---

## 15. The start frame was never actually 4K (2026-08-29, third pass) — CORRECTION to §14

§14 claimed the poster path was "1.9× sharper" and switched frame 1 onto it. **That measurement was wrong and the conclusion was wrong.** It compared Laplacian variance between images of *different pixel dimensions* (a 3840-wide poster vs a 1920-wide sprite cell). Laplacian variance is scale-dependent, so that comparison is meaningless — a larger image has gentler pixel-to-pixel gradients for identical content. The user reported frame 1 still looked soft, and worse than frames 2+, which is exactly what a bad source would produce.

### What was actually wrong

`assets/hero-poster/hero-poster.webp` was **3840×2160 in dimensions but contained no detail above 1080p** — it was a 1080p frame upscaled to 4K.

Proof: round-trip it 4K → 1080p → 4K and measure what changes. A genuine 4K render loses a lot; an upscale loses ~nothing.

| | detail lost by 4K→1080p→4K |
|---|---|
| old `hero-poster.webp` | **0.259** grey levels — essentially none |
| frame 1 re-extracted from the master | 0.334 |

Measured at a matched 1920×1080 (so the numbers are comparable), the old poster was the **softest** source in the project:

| source (all normalised to 1920×1080) | gradient | top-octave |
|---|---|---|
| old `hero-poster.webp` (shipping) | 0.702 | 0.422 |
| sprite cell q-75 (what frames 2+ use) | 0.700 | 0.435 |
| sprite cell, uncompressed | 0.807 | 0.496 |
| **frame 1 from the 8K master** | **0.760** | **0.478** |

### The fix

`Hero_V8.mp4` in the project root is a **7680×4320 (8K) HEVC master** — the `v8` in the sprite URLs. Frame 1 was re-extracted from it and Lanczos-downscaled to 3840×2160:

```
ffmpeg -i Hero_V8.mp4 -vf "select=eq(n\,0),scale=3840:2160:flags=lanczos" -vframes 1 frame1.png
```

Encoded to WebP at quality 95 → **200.6 KB, versus the old file's 203.7 KB.** Same bytes, real 4K detail. Measured as painted at the 2880-wide canvas: gradient 0.498 / top-octave 0.280, against the sprite path's 0.429 / 0.188.

The old file is kept as `hero-poster-1080p-upscale-backup.webp`. The cache-buster was bumped `v8_4k → v9_4k` (4 references) because the filename did not change.

Also removed: an `initialPoster` Image that loaded the poster a **second time** on the critical path and stored it in a `this.frames` array that nothing ever read. Verified: poster fetches went 2 → 1.

### Frames 2+ — deliberately left alone, with numbers

Raising sprite quality is a bad trade, measured at the real canvas size:

| sheet quality | payload (250 sheets) | gradient | top-octave |
|---|---|---|---|
| q-75 (current) | 28 MB | 0.429 | 0.188 |
| q-85 | 44 MB | 0.448 | 0.202 |
| q-92 | 60 MB | 0.446 | 0.201 |
| uncompressed | 92 MB | 0.479 | 0.210 |

q-85 buys ~+4% gradient for +57% bandwidth; q-92 buys **nothing** over q-85. The ceiling even uncompressed (0.479) is still below the new poster (0.498). **The limit on frames 2+ is the 1920×1080 cell resolution, not compression** — and more bytes per sheet also means slower decode and more memory pressure, which is the Safari problem in §14. The only real path to sharper motion frames is re-packing the sheets at a higher per-cell resolution from the 8K master, which multiplies the decoded-bitmap footprint that §14 is already fighting.

### Method note

Never compare Laplacian variance (or any per-pixel gradient metric) across images of different pixel dimensions. Normalise everything to one reference resolution first, and test for real resolution with a downscale/upscale round-trip rather than trusting the pixel dimensions in the file header.

---

## 16. Why it's smooth in Chrome and not in Safari (2026-08-29, fourth pass)

### The single root cause

**Safari decodes images for canvas synchronously, on the main thread. Chrome does not.**

That one difference explains the whole Chrome/Safari split. Neither browser honours the intent of `img.decode()` — but Chrome decodes off-thread anyway, so it never shows; Safari does the decode work on the same thread that runs the scroll, so every sheet that arrives is a visible stall.

The [cross-browser matrix](https://calendar.perfplanet.com/2025/non-blocking-image-canvas/) is unambiguous — exactly one path avoids blocking WebKit:

| approach | blocks |
|---|---|
| plain `<img>` → `drawImage` | Chrome, Safari, Firefox |
| `img.decode()` → `drawImage` (**what this site did**) | **Chrome, Safari** |
| `decode()` → `createImageBitmap(<img>)` → `drawImage` | Chrome only |
| `fetch` → `blob` → `createImageBitmap(blob)` | Safari, Firefox |

Note the trap: the Blob form is the *Chromium* fix and makes Safari worse. The fix for Safari is `createImageBitmap` from an **HTMLImageElement**.

### Why the payload makes it so much worse here than for Apple

Measured directly off Apple's AirPods Pro scroll sequence (`apple.com/105/media/us/airpods-pro/2019/.../anim/sequence/`), which is the canonical example of this technique:

| | Apple | TPL Clinic | ratio |
|---|---|---|---|
| frames in sequence | ~147 | 1,000 | 6.8× |
| largest tier served | **1158×770** | 1920×1080 cell | 2.3× linear |
| bytes per frame | ~30 KB | ~29 KB | ~equal |
| resolution tiers | 400×460 / 800×530 / 1158×770 | 1920 / 2880 / 3840 sheet | — |
| **decoded RAM to display ONE frame** | **3.4 MB** | **31.6 MB** | **9.3×** |
| total sequence payload | ~4.4 MB | ~28 MB | 6.4× |

Two things stand out.

**Apple's largest desktop frame is 1158×770.** Not 1920, not 4K — on a Retina Mac, for a full-bleed hero. They decided the scroll had to stay smooth and let resolution be the variable.

**The sprite sheets are actively harmful on Safari.** Sheets were introduced to cut request count from 1,000 to 250. But to display *one* 1920×1080 frame, the browser must decode and hold a whole 3840×2160 sheet — **four times the pixels actually needed, 31.6 MB resident**. Apple ships one file per frame and decodes 3.4 MB to show 3.4 MB. So Safari is doing ~9× the decode work, synchronously, on the thread that runs the scroll. Requests were the wrong thing to optimise — under HTTP/2 multiplexing, 1,000 small requests are cheap; 250 huge synchronous decodes are not.

### What was changed now

`prepareSprite()` converts each loaded sheet to an **ImageBitmap on WebKit only**, via `decode()` → `createImageBitmap(img)` — the one non-blocking path. Chrome stays on the plain `<img>` path, where it is already fine and where `createImageBitmap` would *introduce* blocking.

Second benefit, worth as much as the first: `ImageBitmap.close()` releases the decoded bitmap **deterministically**. Evicting an `<img>` from the cache only dropped our reference and left WebKit's GC to decide when 31.6 MB actually went away — which is precisely the thrash the eviction policy was trying to prevent. `trimSpriteCache` now calls `.close()`.

Verified end-to-end in Chrome via a temporary `?forcebitmap=1` override (since removed): frames render correctly, no colour shift, eviction and re-entry work, no console errors.

### What is still on the table

This treats the symptom well but the architecture is still ~9× Apple's per-frame memory. In rough order of impact per unit of work:

1. **Serve Safari the 2880 sheet tier instead of 3840.** One line. Cuts decode work and resident memory **44%** immediately. Cost: motion frames drop to 1440×810 cells — still noticeably larger than Apple's 1158×770. Frame 1 is unaffected (it is the 4K poster, §15).
2. **Drop sprite sheets; ship one file per frame** at ~1440×810. Decoded-per-frame goes 31.6 MB → 4.7 MB (**6.7× less**), and Safari only ever decodes the frame it needs. This is Apple's architecture. Requires re-encoding and re-uploading the reel.
3. **Reduce the frame count.** Apple gets a fully cinematic result from ~147 frames; this reel uses 1,000. Fewer, slightly larger frames would be strictly better than many tiny ones.

Options 1 and 2 both trade motion-frame sharpness for smoothness. That trade is exactly the one Apple made, and it is a product decision, not a technical one — so it is documented here rather than applied unilaterally.

---

## 17. "It gets stuck in the middle" — the loader was being outrun (2026-08-29, fifth pass)

§16 fixed *where* decoding happens. This is a different failure: the renderer was fine, the **loader could not keep up**, and `findNearestLoadedSprite` then holds the sequence on a neighbouring frame. That hold is the "stuck" the user perceives — not dropped frames.

### The arithmetic that explains it

The hero is 800vh. On a ~900px viewport that is **6,300px of scroll for 1,000 frames — 6.3px per frame.**

| | frames | px of scroll |
|---|---|---|
| prefetch **ahead** (`centerSprite + 8`) | 32 | **202 px** |
| prefetch **behind** (`centerSprite - 3`) | 12 | **76 px** |
| one macOS wheel notch | — | 120–160 px |
| one trackpad flick | — | 400–1,200 px |

**Every ordinary gesture outran the prefetch.** And the window was biased *forward*, so scrolling back **up** had only 76px of runway — which is exactly why up-down-up-down was the worst case.

Compounding it, the loading gate covers sheets 1–30 densely and then only **every 12th sheet** — so mid-reel, just 1 frame in 48 is preloaded. Hence "stuck **in the middle**" specifically.

### Changes

1. **Direction-aware prefetch.** The window now follows `scrollDir` (from the sign of the scroll delta) instead of always reaching forward. Scrolling up finally gets real runway.
2. **Velocity-scaled depth.** Aims ~25 rendered frames (~0.4s) ahead at the current speed, floored at 48 frames and capped at 120. At rest that is 302px of runway; on a flick, **756px** — versus a flat 202px before.
3. **Nearest-first ordering with a concurrency cap of 8.** The deeper window initially fired **35 simultaneous requests** (measured), which starves the frames the visitor is about to hit. Requests are now issued nearest-to-playhead first, at most 8 at a time, refilling each frame as they settle.
4. **Direction-aware eviction.** `trimSpriteCache` discounts sheets *behind* the playhead 2:1, so the cache retains what the visitor is heading towards while still holding enough for a reversal.
5. **WebKit cache 640MB → 896MB** (20 → 28 sheets, 80 → 112 frames of reel held). The low ceiling in §14 existed only because evicting an `<img>` left WebKit's GC to decide when 31.6MB actually went away. `ImageBitmap.close()` (§16) makes release deterministic, so that defence is no longer needed.

### `?perf=1` — an on-page diagnostic

Because Safari cannot be driven from the dev machine, add `?perf=1` to any URL for a live panel: **fps, worst frame, held frames (the stall count), sheets cached / max, requests in flight, whether ImageBitmap is active, scroll speed and direction.** Counters reset when the loading gate releases, so the numbers describe scrolling rather than load.

Chrome, after: 60fps, **in-flight 0** in steady state (was 35), **2–6 held frames** across sustained up-down-up-down scrubbing.

### Still the structural limit

This is the last big win available without changing the assets. The reel is still ~9× Apple's decoded footprint per displayed frame (§16), so on a slow connection or a weaker Mac the loader can still be outrun. The cures remain, in order: serve WebKit the 2880 tier (one line, −44% decode and memory), or drop sprite sheets for one file per frame (−6.7× decoded per frame, Apple's architecture).

---

## 18. The periodic stick: sprite sheets removed without re-encoding (2026-08-29, sixth pass)

Reported: "smooth, then it gets stuck, then smooth again" — **periodic**, not random. Periodic hitching means work arriving in **lumps**, not work being too slow overall.

### The lump

At 6.3px of scroll per frame, a 4-frame sheet boundary is crossed **every ~25px**. Each crossing required decoding an entire 3840×2160 sheet — **8.29M pixels, ~31.6MB** — to display one 1920×1080 frame. Four frames of smooth playback, then a 31.6MB decode, then four more. That cadence *is* the reported symptom.

§16 moved that decode off the main thread on WebKit, which is why it improved but did not disappear: an off-thread decode still has to finish before the frame can be drawn.

### The fix — and it needed no new assets

ImageKit can crop at the edge. `tr=cm-extract,x-,y-,w-1920,h-1080` pulls a single cell out of the **existing, unmodified** sprite sheet and returns it as a standalone 1920×1080 WebP at ~28.5KB. Four of those total ~114KB against the whole sheet's 116KB, so **bandwidth is unchanged and nothing was re-encoded or re-uploaded**.

The cache unit changed from sheet to frame:

| | before | after |
|---|---|---|
| cache entry | 4-frame sheet | 1 frame |
| decoded per entry | 31.6 MB | **7.9 MB** |
| decode cadence | one 8.29M-px lump every ~25px | four even 2.07M-px pieces |
| frames cached (Safari, 896MB) | 112 | 113 |
| frames decoded but never shown | up to 3 per sheet | none |

Total decode work across a scroll is unchanged — but it is now **evenly distributed instead of spiky**, and frames the visitor never reaches are never decoded. Even reel coverage is the same; only the granularity changed.

The engine change was mostly deletion: `drawSingleFrame` no longer computes a 2×2 sub-rect, `fetchUrgentFrameChunk` no longer converts frames to sheets, and both fetch paths share one `frameUrl(frameNum)` builder that maps frame → sheet + cell.

Also adjusted for the finer unit: `findNearestLoadedSprite` reach 30 → 120, prefetch look-behind 4 → 16, gate 30 sheets dense + every 12th → 120 frames dense + every 24th (156 requests / 4.4MB, versus 48 requests / 5.6MB — **fewer bytes**, and mid-reel coverage improves from 1-in-48 frames to 1-in-24).

Chrome after: 60fps, **1–4 held frames** across sustained up-down-up-down scrubbing.

### Not verified in Safari

This is an architectural change to the hot path and it could not be tested in the browser it targets. It was shipped to a **draft URL first** for side-by-side comparison against production, rather than promoted blind.

### What remains after this

The reel is now ~2.3× Apple's decoded footprint per displayed frame, down from ~9×. The remaining gap is pure resolution: 1920×1080 frames against Apple's 1158×770. Serving WebKit the 2880 tier (cells at 1440×810, still larger than Apple's) is a one-line change that would take another 44% off decode and memory, at a real cost in motion-frame sharpness.
