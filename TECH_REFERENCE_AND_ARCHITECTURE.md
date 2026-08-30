# TPL Clinic (The PRP Lab) — Technical Architecture & Reference Guide

**Project Name:** TPL Clinic (The PRP Lab) — Mayfair, London  
**Live Production URL (Netlify):** [https://tpl-clinic-version-2.netlify.app](https://tpl-clinic-version-2.netlify.app)  
**GitHub Repository:** `https://github.com/imdhirajs/tpl-clinic-version-2.git` (Branch: `main`)  
**Production Commit:** `3a36dd3` (*Fix sprite sheet cell slice calculation to prevent 2x2 grid tiling*)  
**Last Updated:** Sunday, August 30, 2026

---

## 🏛️ Executive Summary & Technology Overview

This project is an award-winning luxury aesthetic medical web application built for **TPL Clinic (Mayfair, London)**. It features a signature **1,000-frame 60fps HTML5 Canvas scroll-scrubbed arrival sequence**, paired with high-performance virtual smooth scrolling, responsive mega-menus, and dedicated clinical treatment sub-pages.

---

## 🛠️ Complete Technology Stack & Specifications

### 1. Rendering Engine & Canvas Pipeline
* **HTML5 Canvas 2D Context (`getContext('2d', { alpha: false })`)**:
  * Offscreen-buffered rendering of 1,000 sequential frames.
  * Auto-capped `devicePixelRatio` (`Math.min(window.devicePixelRatio, 2)`) to balance Retina sharpness with GPU fill-rate efficiency.
  * Top-centered aspect-ratio letterbox calculations (`16:9` source ratio).
  * **Dynamic Sprite Slicing (`drawSingleFrame`)**:
    ```javascript
    const nw = spriteImg.naturalWidth || spriteImg.width;
    const nh = spriteImg.naturalHeight || spriteImg.height;
    const cellW = nw / 2;
    const cellH = nh / 2;
    const sx = cellCol * cellW;
    const sy = cellRow * cellH;
    ctx.drawImage(spriteImg, sx, sy, cellW, cellH, offsetX, offsetY, drawW, drawH);
    ```
    *Extracts exact 1-cell coordinates dynamically regardless of whether the source sheet is 1920, 2560, or 3840 wide, eliminating grid-tiling bugs.*

### 2. Asset Delivery & CDN Architecture
* **ImageKit CDN Edge Storage (`https://ik.imagekit.io/dhiraj1995/assets/hero-sprites-hd/`)**:
  * 250 master spritesheets (`sprite-hd-001.webp` through `sprite-hd-250.webp`).
  * 2×2 grid per sheet (4 frames per sheet = 1,000 frames total).
  * **LOD (Level of Detail) Dynamic Transformation**:
    * Desktop tier: `tr=w-2560,q-72,f-webp` (~58 KB per sheet, ~14.5 MB total payload for entire 1,000 frames).
    * Mobile/Small tablet tier: `tr=w-1920,q-70,f-webp` (~41 KB per sheet).
  * **Instant Poster Fallback**: 4K single-frame poster `hero-poster.webp?v=v9_4k` rendered on millisecond 0 before scrolling begins.

### 3. Preloader Runway & Parallel Background Streamer
* **Method 08 Progressive Preloader**:
  * Blocks scroll until the first 50 sheets (200 frames = 20% of the entire sequence) are 100% downloaded and pre-decoded into GPU memory via `img.decode()` and `createImageBitmap()`.
  * Visual progress bar (`#tpl-loading-bar` and `#tpl-loading-percent`) updates in real-time.
* **8-Worker Parallel Background Streamer**:
  * As soon as the preloader lifts, an 8-stream worker pool downloads the remaining 200 sheets concurrently over HTTP/2.
  * Full 1,000-frame reel becomes 100% cached in RAM within 1.5–2 seconds.
* **Zero-Eviction Memory Buffer (`MAX_SPRITES = 250`)**:
  * Holds all 250 decoded sheets in memory (~500 MB RAM budget) so backward and forward scrubbing never causes garbage collection pauses or re-downloads.

### 4. Single-Loop Animation & Scroll Synchronization
* **Lenis Virtual Scroll (`lenis@1.1.18`)**:
  * Physics-based smooth inertia and momentum: `duration: 1.2`, `wheelMultiplier: 1.0`, `touchMultiplier: 1.2`.
  * Exponential deceleration curve: `easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))`.
* **GSAP Ticker Integration (`gsap.ticker`)**:
  * Unified single-loop rendering: `gsap.ticker.add((time) => lenis.raf(time * 1000)); gsap.ticker.lagSmoothing(0);`
  * Eliminates dual-scroll race conditions between native browser scrolling and virtual scroll.

### 5. Multi-Page Architecture & Route Map
* **Main Landing Page**:
  * `index.html` — Signature 1,000-frame hero, beat-synced hotspot cards, philosophy section, technology index, patient reviews, and booking modal.
* **Specialized Clinical Treatment Pages**:
  * `prp.html` — Dedicated signature Platelet Rich Plasma (PRP) treatment deep-dive.
  * `sofwave.html` — Sofwave™ Ultrasound Lifting treatment page with video loops and clinical clinical data.
  * `services.html` — Master 20-treatment clinical index with interactive category filter pills.
  * `about.html` — Clinic history, 10 Harley Street Mayfair location, and practitioner team.
  * `terms-conditions.html` & `gdpr.html` — Medical compliance, GDPR policies, and cancellation guidelines.

### 6. Interactive UI & Design System
* **Smart Glassmorphism Navigation**:
  * State-cached header automatically alternates between `transparent`, `dark` (`rgba(8, 19, 89, 0.92)`), and `light` (`rgba(255, 255, 255, 0.9)`) depending on the section underneath.
* **Mega Menus**: Multi-column responsive treatments catalogue dropdown with preview promo cards.
* **Kinetic Text & Media Reveals**: `IntersectionObserver` triggered GPU CSS transforms (`cubic-bezier(.22,1,.36,1)`).
* **Typography**: Jost Google Font with tailored tracking and font weights (200–700).

---

## 🔮 Future Quality Upgrade Notes (For Future Revisions)

When you want to increase image sharpness to ultra-high 4K quality in the future:
1. **Dialing ImageKit Quality & Resolution**:
   In `index.html` line ~1420:
   * To bump quality: Change `q-72` to `q-82` or `q-88` (e.g. `this.SPRITE_TR = 'w-3840,q-85,f-webp'`).
   * *Note: Higher resolution increases individual sheet sizes from ~58 KB to ~150–250 KB, which can be balanced by extending the preloader buffer.*
2. **AVIF Next-Gen Format**:
   * ImageKit supports `f-avif`. AVIF delivers ~30% higher visual quality at identical byte sizes to WebP.
