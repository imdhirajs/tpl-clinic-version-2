/* ═══════════════════════════════════════════════════════════════════════════
   TPL Clinic — the mobile runtime
   ═══════════════════════════════════════════════════════════════════════════

   Companion to assets/css/tpl-mobile.css. Everything the phone layout needs
   that CSS cannot express, in one file shared by every page.

   Three things to know before editing:

   1. The pages render through the dc runtime, which builds the DOM from the
      <x-dc> template after React loads. Nothing in the markup exists at
      parse time, so this file waits for the header to appear rather than for
      DOMContentLoaded.

   2. That same runtime renders once — setState never re-renders — so every
      interaction here is plain DOM, matching the pattern already used inside
      each page's componentDidMount.

   3. The page scripts also write inline styles onto the header. This file
      does not fight them: it stamps data-theme and lets the !important rules
      in the stylesheet win below 1024px. Above 1024px it stays out of the
      way entirely.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var PHONE = '(max-width: 767px)';
  var HANDHELD = '(max-width: 1023px)';
  var TEL = '+442079987077';
  var TEL_DISPLAY = '020 7998 7077';
  var WHATSAPP = 'https://wa.me/442079987077';
  var MAPS = 'https://maps.google.com/?q=22+Seymour+Street,+London+W1H+7HY';

  var isHandheld = function () { return window.matchMedia(HANDHELD).matches; };
  var isPhone = function () { return window.matchMedia(PHONE).matches; };
  var reduced = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  var icon = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    /* Brand green, not currentColor. Every WhatsApp call to action on the
       desktop pages carries the mark in #25D366 and the label in the site's own
       colours; this bar and the drawer are the two places a phone sees one, so
       they follow the same rule. Call and Book stay in currentColor — they are
       ours, not a third party's. */
    whatsapp: '<svg viewBox="0 0 24 24" fill="#25D366"><path d="M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A9.9 9.9 0 1 0 12 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.1Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5 0a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.5a1.7 1.7 0 0 0 .2-.4.4.4 0 0 0 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.1 11.1 0 0 0 4.3 3.8 8.2 8.2 0 0 0 1.4.5 3.4 3.4 0 0 0 1.6.1 2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>'
  };

  /* ── Boot ────────────────────────────────────────────────────────────────
     Waiting for the header to exist is not enough. The page ships its markup
     inside <x-dc>, which the runtime parses into a React tree and then throws
     away — so a header found before that swap is a node that is about to be
     discarded, taking every listener and every attribute stamped on it along
     with it. (Worse: attributes written to the template before it is read are
     carried into the props, so a stale value gets baked into the real page.)

     <x-dc> leaving the document is the swap completing. Wait for that. */
  function isRendered() {
    return !document.querySelector('x-dc') && !!document.querySelector('header[data-nav="1"]');
  }

  function whenRendered(fn) {
    if (isRendered()) { fn(); return; }
    var obs = new MutationObserver(function () {
      if (!isRendered()) return;
      obs.disconnect();
      fn();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    // Backstop: if the runtime never boots (a blocked script, an offline
    // phone) there is nothing to enhance, and the observer should not run for
    // the life of the tab.
    setTimeout(function () { obs.disconnect(); }, 15000);
  }

  /* ══ Header theme ═════════════════════════════════════════════════════════
     Which of the two headers is legible depends entirely on what is passing
     under it. The homepage's desktop engine already works this out inside its
     scroll loop — but that loop only runs on desktop, so on a phone the
     homepage header kept its dark-hero styling all the way down a white page
     and the menu button disappeared into the background.

     Reading the band under the bar covers every page with the same rule. */
  function initHeaderTheme() {
    var nav = document.querySelector('header[data-nav="1"]');
    if (!nav) return;

    // Re-queried rather than cached: the runtime can finish committing the
    // template after this file has already run, and a list captured a beat too
    // early is empty — which reads as "nothing dark under the bar" and leaves a
    // white header sitting on the hero. Three elements per scroll frame costs
    // nothing next to the getBoundingClientRect it was going to do anyway.
    var apply = function () {
      if (!isHandheld()) { nav.removeAttribute('data-theme'); return; }
      var probe = 46; // a point just below the middle of the bar
      /* [data-dark] only. This list used to include [data-hero="1"], which was
         true when the homepage hero was navy — V5. The hero is now a white
         film, so counting it as a dark band stamped data-theme="dark" and put a
         navy bar with white labels over a white picture on phones, while the
         desktop bar was frosted white. The two read as different sites.

         Every genuinely dark hero on the other pages already carries
         data-dark="1" on the same element, so dropping [data-hero="1"] changes
         nothing for them — it only stops the white hero being called dark. */
      var bands = document.querySelectorAll('[data-dark]');
      var overDark = Array.prototype.some.call(bands, function (el) {
        var r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      nav.setAttribute('data-theme', overDark ? 'dark' : 'light');

      // A dark band under the bar is not on its own a reason to go transparent.
      // The bar may only drop its background while it is floating over the hero;
      // over a mid-page navy band (the results timeline, the consultation form)
      // a transparent header let the page scroll straight through it and the nav
      // labels collided with the content behind them. data-float marks the one
      // case that earns transparency — see tpl-mobile.css.
      var heroEl = document.querySelector('.tpl-sec--hero, [data-hero="1"]');
      var inHero = heroEl ? heroEl.getBoundingClientRect().bottom > probe : false;
      if (overDark && inHero) nav.setAttribute('data-float', '1');
      else nav.removeAttribute('data-float');
    };

    // --tpl-header-h drives the anchor offsets and the sticky anchor rail, so
    // it has to be the header's real height — which moves with the safe-area
    // inset and with whatever the logo settles at once fonts have loaded.
    var measure = function () {
      var h = Math.round(nav.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--tpl-header-h', h + 'px');
    };

    var sync = function () { measure(); apply(); };
    window.addEventListener('scroll', apply, { passive: true });
    window.addEventListener('resize', sync);
    // Bands move as lazy images resolve their height.
    window.addEventListener('load', sync);
    sync();
  }

  /* ══ Drawer ═══════════════════════════════════════════════════════════════
     The shipped drawer offered three anchors and six page links. The desktop
     mega menu, on the same pages, offered all twenty treatments — so a phone
     visitor could not reach seventeen of the things the clinic does.

     Rather than copy that list into seven files, the groups are cloned out of
     the mega menu already in the page. One source, and the drawer cannot
     drift out of date. */
  function initDrawer() {
    var drawer = document.querySelector('.tpl-mobile-drawer');
    if (!drawer || drawer.getAttribute('data-tpl-rebuilt') === '1') return;

    var logo = drawer.querySelector('img');
    var logoSrc = logo ? logo.getAttribute('src') : 'assets/brand/tpl-logo.png';
    var home = document.querySelector('header[data-nav="1"] a[href$="index.html"], header[data-nav="1"] a[href="#top"]');
    var homeHref = home ? home.getAttribute('href') : 'index.html';

    // Existing links, so the drawer keeps whatever paths this page uses
    // (index.html#face on inner pages, #face on the homepage).
    var existing = {};
    Array.prototype.forEach.call(drawer.querySelectorAll('a[href]'), function (a) {
      var label = (a.textContent || '').trim().toLowerCase();
      existing[label] = a.getAttribute('href');
    });
    var href = function (label, fallback) {
      var k = label.toLowerCase();
      return existing[k] || fallback;
    };

    // .tpl-mega-menu is Prathamesh's class (used as-is on the 6 inner pages);
    // .tpl-services-mega is the homepage's own Services panel — a separate
    // class there because the homepage already had an unrelated element
    // named .tpl-mega-menu (the old Treatments dropdown, since removed).
    // Querying both means this script finds the real content everywhere
    // rather than silently returning zero groups on the homepage.
    var groups = Array.prototype.slice.call(document.querySelectorAll('.tpl-mega-menu > div, .tpl-services-mega > div'))
      .filter(function (col) { return col.querySelector('.tpl-mega-title'); });

    var groupsHtml = groups.map(function (col, i) {
      var title = col.querySelector('.tpl-mega-title').textContent.trim();
      var links = Array.prototype.slice.call(col.querySelectorAll('a')).map(function (a) {
        var target = a.getAttribute('target') ? ' target="_blank" rel="noopener"' : '';
        return '<a href="' + a.getAttribute('href') + '"' + target + '>' + a.innerHTML + '</a>';
      }).join('');
      return '' +
        '<div class="tpl-drawer-group" aria-expanded="false">' +
          '<div class="tpl-drawer-group-btn" role="button" tabindex="0" aria-expanded="false" id="tpl-dg-b' + i + '" aria-controls="tpl-dg-p' + i + '">' +
            '<span>' + title + '</span><span class="mark" aria-hidden="true">+</span>' +
          '</div>' +
          '<div class="tpl-drawer-group-panel" id="tpl-dg-p' + i + '" role="region" aria-labelledby="tpl-dg-b' + i + '">' +
            '<div>' + links + '</div>' +
          '</div>' +
        '</div>';
    }).join('');

    /* about.html has no consultation section of its own — it was removed on
       the client's instruction — so an in-page "#consultation" from the drawer
       would scroll nowhere there. Same fallback initActionBar() already uses:
       stay on the page when the section exists, otherwise send the visitor to
       the homepage's. */
    var drawerBookHref = document.querySelector('#consultation')
      ? '#consultation'
      : 'index.html#consultation';

    drawer.innerHTML = '' +
      '<div class="tpl-drawer-head">' +
        '<a href="' + homeHref + '" aria-label="TPL Clinic — home">' +
          '<img src="' + logoSrc + '" alt="TPL Clinic" width="300" height="300" />' +
        '</a>' +
        '<button type="button" class="tpl-drawer-close" aria-label="Close menu">' +
          '<span>Close</span><span aria-hidden="true" style="font-size:17px;line-height:1">&#10005;</span>' +
        '</button>' +
      '</div>' +

      '<div class="tpl-drawer-body">' +
        '<a class="tpl-drawer-link tpl-drawer-link--gold" style="margin-top:18px" href="' + homeHref + '">Home</a>' +

        '<div class="tpl-drawer-eyebrow">Services</div>' +
        (groupsHtml || '') +
        '<a class="tpl-drawer-link tpl-drawer-link--gold" href="' + href('services index', 'services.html') + '">Services index</a>' +

        '<div class="tpl-drawer-eyebrow">About</div>' +
        '<a class="tpl-drawer-link" href="' + href('about us', 'about.html') + '">About us</a>' +
      '</div>' +

      '<div class="tpl-drawer-foot">' +
        '<a class="tpl-drawer-cta tpl-drawer-cta--gold" href="' + drawerBookHref + '">Book a consultation</a>' +
        '<div class="tpl-drawer-row">' +
          '<a class="tpl-drawer-cta tpl-drawer-cta--ghost" href="tel:' + TEL + '">Call</a>' +
          '<a class="tpl-drawer-cta tpl-drawer-cta--ghost tpl-drawer-cta--wa" href="' + WHATSAPP + '">' + icon.whatsapp + 'WhatsApp</a>' +
        '</div>' +
        '<div class="tpl-drawer-addr">22 SEYMOUR STREET · MAYFAIR W1H 7HY<br />' + TEL_DISPLAY + '</div>' +
      '</div>';

    drawer.setAttribute('data-tpl-rebuilt', '1');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Menu');

    var close = function () { drawer.classList.remove('is-open'); };

    // Accordions are divs, not buttons, on purpose: each page's own script
    // binds "close the drawer" to every <a> and <button> inside this panel,
    // and a group header must open a group without closing the drawer.
    Array.prototype.forEach.call(drawer.querySelectorAll('.tpl-drawer-group-btn'), function (btn) {
      var group = btn.parentElement;
      var toggle = function () {
        var open = group.getAttribute('aria-expanded') === 'true';
        group.setAttribute('aria-expanded', open ? 'false' : 'true');
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      };
      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });

    // The page script attached its close handler to the markup this replaced,
    // so the new links need their own.
    Array.prototype.forEach.call(drawer.querySelectorAll('a'), function (a) {
      a.addEventListener('click', close);
    });
    drawer.querySelector('.tpl-drawer-close').addEventListener('click', close);

    // Scroll lock, driven by the class rather than by the toggle, so it holds
    // whoever opens or closes the drawer.
    var scrollY = 0;
    new MutationObserver(function () {
      var open = drawer.classList.contains('is-open');
      if (open && !document.body.classList.contains('tpl-locked')) {
        scrollY = window.scrollY;
        document.body.style.top = (-scrollY) + 'px';
        document.body.classList.add('tpl-locked');
        var first = drawer.querySelector('.tpl-drawer-close');
        if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
      } else if (!open && document.body.classList.contains('tpl-locked')) {
        document.body.classList.remove('tpl-locked');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      }
    }).observe(drawer, { attributes: true, attributeFilter: ['class'] });

    // Keep focus inside the panel while it is open.
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
      var f = drawer.querySelectorAll('a[href], button, [tabindex="0"]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ══ Action bar ═══════════════════════════════════════════════════════════
     There is no online booking by design — every enquiry becomes a call, a
     WhatsApp message or the callback form. On a phone all three sit under the
     thumb for the whole scroll, and step aside when the form itself arrives. */
  function initActionBar() {
    if (document.querySelector('.tpl-actionbar')) return;

    var consult = document.querySelector('#consultation');
    var bookHref = consult ? '#consultation' : 'index.html#consultation';

    var bar = document.createElement('nav');
    bar.className = 'tpl-actionbar';
    bar.setAttribute('aria-label', 'Contact the clinic');
    bar.innerHTML =
      '<a href="tel:' + TEL + '">' + icon.phone + '<span>Call</span></a>' +
      '<a href="' + WHATSAPP + '" rel="noopener">' + icon.whatsapp + '<span>WhatsApp</span></a>' +
      '<a href="' + bookHref + '">' + icon.calendar + '<span>Book</span></a>';
    document.body.appendChild(bar);

    // Out of the way while the enquiry form — the same call to action, in full
    // — is on screen, and while the drawer or the confirmation modal is up.
    var hide = function (on) { bar.setAttribute('data-hidden', on ? '1' : '0'); };
    var formInView = false, overlayUp = false;
    var sync = function () { hide(formInView || overlayUp); };

    if (consult && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        formInView = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.12 }).observe(consult);
    }

    var drawer = document.querySelector('.tpl-mobile-drawer');
    var modal = document.getElementById('tpl-modal');
    var watch = function (el, test) {
      if (!el) return;
      new MutationObserver(function () {
        overlayUp = (drawer && drawer.classList.contains('is-open')) ||
                    (modal && modal.style.display === 'flex');
        sync();
      }).observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
    };
    watch(drawer);
    watch(modal);
  }

  /* ══ Anchor rail ══════════════════════════════════════════════════════════
     The treatment pages' in-page nav was hidden below 1024px. Unhidden by the
     stylesheet; given a current-section marker here, and scrolled so the
     marker stays in view as you read down a very long page. */
  function initAnchorRail() {
    var rail = document.querySelector('.tpl-anchorbar');
    if (!rail) return;
    var scroller = rail.querySelector('.tpl-anchorbar-inner');
    var links = Array.prototype.slice.call(rail.querySelectorAll('a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var current = null;
    var mark = function (link) {
      if (link === current) return;
      current = link;
      links.forEach(function (a) { a.classList.toggle('is-current', a === link); });
      if (!scroller || !isHandheld()) return;
      var want = link.offsetLeft - (scroller.clientWidth - link.offsetWidth) / 2;
      scroller.scrollTo({ left: Math.max(0, want), behavior: reduced() ? 'auto' : 'smooth' });
    };

    var visible = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0); });
      var best = null, bestRatio = 0;
      links.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        var r = visible.get(id) || 0;
        if (r > bestRatio) { bestRatio = r; best = a; }
      });
      if (best) mark(best);
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.15, 0.5, 1] });

    links.forEach(function (a) {
      var t = document.querySelector(a.getAttribute('href'));
      if (t) io.observe(t);
    });
  }

  /* ══ Enquiry form ═════════════════════════════════════════════════════════
     The callback form is the conversion path, and on a phone it was the least
     forgiving thing on the site: no autofill hints, the wrong keyboard for
     every field, and a confirmation modal that appeared whether or not you had
     typed anything. */
  function initForm() {
    var form = document.querySelector('#consultation');
    if (!form) return;

    var byLabel = function (text) {
      var labels = Array.prototype.slice.call(form.querySelectorAll('label'));
      var hit = labels.filter(function (l) {
        return (l.textContent || '').trim().toLowerCase().indexOf(text) === 0;
      })[0];
      return hit ? hit.querySelector('input, select, textarea') : null;
    };

    var first = byLabel('first name');
    var last = byLabel('last name');
    var email = byLabel('email');
    var phone = byLabel('telephone');
    var message = byLabel('message');
    var consent = form.querySelector('input[type="checkbox"]');

    var hint = function (el, autocomplete, extra) {
      if (!el) return;
      el.setAttribute('autocomplete', autocomplete);
      el.setAttribute('autocapitalize', extra && extra.caps ? 'words' : 'off');
      if (extra && extra.inputmode) el.setAttribute('inputmode', extra.inputmode);
      if (extra && extra.type) el.setAttribute('type', extra.type);
      if (extra && extra.placeholder) el.setAttribute('placeholder', extra.placeholder);
      el.setAttribute('spellcheck', 'false');
    };
    hint(first, 'given-name', { caps: true, placeholder: 'Jane' });
    hint(last, 'family-name', { caps: true, placeholder: 'Doe' });
    hint(email, 'email', { inputmode: 'email', type: 'email', placeholder: 'you@example.com' });
    hint(phone, 'tel', { inputmode: 'tel', type: 'tel', placeholder: '07700 900000' });
    if (message) {
      message.setAttribute('autocapitalize', 'sentences');
      message.setAttribute('spellcheck', 'true');
      message.setAttribute('placeholder', 'What would you like to address?');
    }

    // Widen the tap target on the consent row.
    if (consent && consent.closest('label')) consent.closest('label').classList.add('tpl-m-consent');

    var note = document.createElement('div');
    note.className = 'tpl-form-note';
    note.setAttribute('role', 'alert');
    note.hidden = true;
    var submit = form.querySelector('[data-submit="1"]');
    if (!submit) return;
    submit.parentNode.insertBefore(note, submit.nextSibling);

    var flag = function (el, bad) {
      if (!el) return;
      el.classList.toggle('tpl-field-error', bad);
      if (bad) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    };

    // Runs before the page's own click handler opens the confirmation modal —
    // capture phase, and stop the event when the form is not ready to send.
    submit.addEventListener('click', function (e) {
      var problems = [];
      var noName = first && !first.value.trim();
      var mail = email ? email.value.trim() : '';
      var tel = phone ? phone.value.trim() : '';
      var noReach = !mail && !tel;
      var badMail = mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail);

      flag(first, noName);
      flag(email, noReach || badMail);
      flag(phone, noReach);

      if (noName) problems.push('your first name');
      if (noReach) problems.push('an email address or a telephone number');
      else if (badMail) problems.push('a valid email address');
      if (consent && !consent.checked) problems.push('your consent to be contacted');

      if (!problems.length) { note.hidden = true; return; }

      e.preventDefault();
      e.stopImmediatePropagation();
      note.textContent = 'Please add ' + problems.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.';
      note.hidden = false;
      var target = noName ? first : (noReach || badMail ? (badMail ? email : (phone || email)) : consent);
      if (target) {
        try { target.focus({ preventScroll: false }); } catch (err) { target.focus(); }
      }
    }, true);
  }

  /* ══ Telephone numbers ════════════════════════════════════════════════════
     The number is printed in the clinic block and the footer of every page as
     plain text. On a phone a printed number that does not dial is a dead end. */
  function initTelLinks() {
    var pattern = /^0?20\s?7998\s?7077$/;
    Array.prototype.forEach.call(document.querySelectorAll('span, div'), function (el) {
      if (el.children.length) return;
      var text = (el.textContent || '').trim();
      if (!pattern.test(text)) return;
      if (el.closest('a')) return;
      var a = document.createElement('a');
      a.href = 'tel:' + TEL;
      a.textContent = text;
      a.style.color = 'inherit';
      a.style.textDecoration = 'none';
      el.textContent = '';
      el.appendChild(a);
    });
  }

  /* ══ Directions ═══════════════════════════════════════════════════════════
     A Mayfair address on a phone is a request for directions. */
  function initDirections() {
    var clinic = document.querySelector('#clinic');
    if (!clinic || clinic.querySelector('[data-tpl-directions]')) return;
    var wa = clinic.querySelector('a[href*="wa.me"]');
    if (!wa) return;
    var link = document.createElement('a');
    link.setAttribute('data-tpl-directions', '1');
    link.href = MAPS;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Get directions';
    link.setAttribute('style', wa.getAttribute('style') || '');
    /* The button is a copy of the WhatsApp one standing next to it, so it has
       to copy the classes as well as the inline style — those are what carry
       the mobile treatment. Without this the WhatsApp button went full width on
       a phone and Get directions, sitting directly beneath it, did not. */
    link.className = wa.className;
    link.style.marginTop = '12px';
    link.style.display = 'inline-block';
    wa.parentNode.insertBefore(link, wa.nextSibling);
  }

  /* ══ Video on a phone ═════════════════════════════════════════════════════
     The site autoplays eight loops totalling around fifteen megabytes. On a
     desktop that is a design flourish; on a phone data plan it is a bill the
     visitor did not agree to, spent mostly on film they will never look at.

     Three kinds, treated differently:

       · The homepage hero film IS the content, and it is the one thing a
         visitor sees first. It plays, unless the connection says otherwise.
       · Loops sitting under text at low opacity are texture. Poster only,
         and their sources are removed so nothing is fetched at all.
       · Everything else — the philosophy loop, the Sofwave treatment film —
         is content the visitor may well want. It holds its poster and gains
         a play control, so the megabytes are spent when they are asked for. */
  function initVideo() {
    if (!isPhone()) return;
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var thrifty = !!(conn && (conn.saveData === true || /^(slow-)?2g$/.test(conn.effectiveType || '')));

    var park = function (v, drop) {
      var poster = v.getAttribute('poster');
      v.removeAttribute('autoplay');
      v.autoplay = false;
      v.preload = 'none';
      try { v.pause(); } catch (e) {}
      if (!poster) return;
      v.style.background = "url('" + poster + "') center/cover no-repeat";
      if (!drop) return;
      v.__tplSources = Array.prototype.map.call(v.querySelectorAll('source'), function (s) {
        return { src: s.getAttribute('src'), type: s.getAttribute('type') };
      });
      Array.prototype.forEach.call(v.querySelectorAll('source'), function (s) { s.remove(); });
      v.removeAttribute('src');
      try { v.load(); } catch (e) {}
    };

    Array.prototype.forEach.call(document.querySelectorAll('video'), function (v) {
      if (v.closest('[data-hero-media="1"]')) {
        if (thrifty) park(v, true);
        return;
      }

      var opacity = parseFloat(getComputedStyle(v).opacity || '1');
      if (opacity <= 0.5) { park(v, true); return; }   // texture behind text

      park(v, thrifty);
      if (thrifty) return;

      var frame = v.parentElement;
      if (!frame || frame.querySelector('.tpl-video-play')) return;
      if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative';

      var play = document.createElement('button');
      play.type = 'button';
      play.className = 'tpl-video-play';
      play.setAttribute('aria-label', 'Play film');
      play.innerHTML = '<span class="glyph" aria-hidden="true">&#9654;</span><span class="label">Play</span>';
      play.addEventListener('click', function () {
        v.preload = 'auto';
        v.setAttribute('controls', 'controls');
        play.remove();
        try { v.load(); } catch (e) {}
        var go = v.play();
        if (go && go.catch) go.catch(function () {});
      });
      frame.appendChild(play);
    });
  }

  /* ══ Homepage story deck ══════════════════════════════════════════════════
     Four rules under the cards, the one you are on filled. */
  function initStoryDeck() {
    var deck = document.querySelector('.tpl-mstory-deck');
    var dots = document.querySelector('.tpl-mstory-dots');
    if (!deck || !dots) return;
    var cards = Array.prototype.slice.call(deck.children);
    var marks = Array.prototype.slice.call(dots.children);
    var tick = function () {
      var mid = deck.scrollLeft + deck.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      marks.forEach(function (m, i) { m.classList.toggle('is-on', i === best); });
    };
    deck.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  /* ── Go ──────────────────────────────────────────────────────────────── */
  whenRendered(function () {
    initHeaderTheme();
    initTelLinks();
    initForm();
    initAnchorRail();
    initStoryDeck();

    var handheldOnly = function () {
      if (!isHandheld()) return;
      initDrawer();
      initDirections();
      initActionBar();
      initVideo();
    };
    handheldOnly();
    // A tablet rotated into portrait, or a desktop window dragged narrow,
    // crosses the breakpoint without a reload.
    window.matchMedia(HANDHELD).addEventListener
      ? window.matchMedia(HANDHELD).addEventListener('change', handheldOnly)
      : window.matchMedia(HANDHELD).addListener(handheldOnly);
  });
})();
