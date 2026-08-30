# TPL Clinic (The PRP Lab) — Project Memory & Handoff Document

**Date & Time:** Wednesday, August 26, 2026 — 17:16:24 IST (`2026-08-26T17:16:24+05:30`)  
**Project Name:** TPL Clinic (The PRP Lab) — Mayfair, London  
**Live Production URL:** [https://tpl-clinic-version-2.netlify.app](https://tpl-clinic-version-2.netlify.app)  
**GitHub Repository:** `https://github.com/imdhirajs/tpl-clinic-version-2.git` (Remote: `v2`, Branch: `main`)  
**Active Git Commit:** `1c10c11` (*Implement Method 08 Luxury Preloader Bar so 1st scroll is 100% as buttery smooth as 2nd scroll*)

---

## 🎯 Primary Project Objective

1. **User Ownership — Home Page & Canvas Hero Section (`index.html`)**:
   - The user built and owns the **Home Page & Hero Section**, featuring the signature **1000-frame 60fps HTML5 Canvas scroll animation** depicting the TPL Clinic arrival sequence in Mayfair.
   - **Mandatory Directive:** Keep the Home Page and Hero Section intact, performing with zero lag on first load.

2. **Prathamesh Ownership — Inner Pages (`TPL-Clinic-main (by Prathamesh Version 1.2)`)**:
   - Prathamesh built the inner pages and secondary site sections:
     - `services.html` (20-Treatment Index with category filter pills)
     - `prp.html` (Platelet Rich Plasma Signature page)
     - `sofwave.html` (Sofwave™ Ultrasound Lifting page)
     - `about.html` (Mayfair Clinic & Practitioners page)
     - `gdpr.html` & `terms-conditions.html` (Legal pages)

---

## 🛠️ Work Accomplished & Technical Achievements

### 1. Canvas Hero Animation & Performance Engine (Method 08 Optimization)
- **1000-Frame ImageKit CDN Asset Pipeline:**
  - High-definition WebP sprite sheets hosted on ImageKit (`https://ik.imagekit.io/dhiraj1995/assets/hero-sprites-hd/`).
- **First-Scroll Smoothness Fix (Method 08 Preloader):**
  - Resolved the first-scroll lag issue where un-decoded image textures caused frame drops during the initial scroll down.
  - Implemented `img.decode()` GPU async texture preloading combined with a luxury preloader progress bar (`#tpl-preload-bar`).
  - First load and second load render at identical 60fps frame-exact precision.
- **Direct 1:1 Input Scrubbing:**
  - Removed double-damped lerp drag so canvas frame updates map 1:1 instantly to mouse wheel and touch input.

### 2. Hosting & Deployment Setup
- Linked production build to Netlify (`https://tpl-clinic-version-2.netlify.app`).
- Configured git remote `v2` pointing to `https://github.com/imdhirajs/tpl-clinic-version-2.git` on branch `main`.
- Direct deployment verified via `npx netlify-cli deploy --prod`.

---

## 🔄 Current Working State

- All experimental header and mega-menu modifications were hard-reset back to commit **`1c10c11`**.
- The codebase is clean, build tree is 100% clean, and `git status` shows `nothing to commit, working tree clean`.
- The live Netlify URL is serving the original, ultra-fast, smooth Home Page canvas animation.

---

## 📌 Memory Notes for Next Session Restart

- **Active Commit:** `1c10c11`
- **Home Page File:** `index.html` (Canvas Hero + Home Page logic)
- **Decoupled Component Template:** `TPL Clinic.dc.html`
- **Runtime Engine:** `support.js`
- **Prathamesh Reference Directory:** `TPL-Clinic-main (by Prathamesh Version 1.2)/site/`
