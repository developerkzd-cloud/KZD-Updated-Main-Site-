/* ==========================================================================
   KZD Solutions — Problems We Solve (homepage)

   1. Entrance: the left column fades up once, 80ms apart.
   2. Rail / progress bar and the cover effect: one rAF-throttled scroll
      handler reads live rects and sets --p / --q / --f on each card (see
      css/kzd-problems.css). Lenis scrolls the window natively, so its scroll
      events arrive here too.
   3. Fit: --header-h from the real header; a static list when a card cannot
      be shown whole (short screen, reduced motion, content too tall).
   4. Smooth scrolling with Lenis (js/vendors/lenis.min.js): pointer devices
      only, never under reduced motion, paused whenever a modal or the mobile
      menu locks the page.
   No dependencies besides Lenis; no jQuery.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var touchOnly = window.matchMedia("(hover: none) and (pointer: coarse)");
  var lenis = null;

  function headerHeight() {
    var nav = document.querySelector("header .navbar, header nav");
    return nav ? Math.round(nav.getBoundingClientRect().height) : 0;
  }

  /* ---------------------------------------------------------------------- */
  function initSection() {
    var section = document.querySelector(".kzd-problems");
    if (!section) return;
    var list = section.querySelector(".kzd-problems__cards");
    var items = Array.prototype.slice.call(section.querySelectorAll(".kzd-problems__item"));
    var cards = items.map(function (it) { return it.querySelector(".kzd-problems__card"); });
    var links = Array.prototype.slice.call(section.querySelectorAll(".kzd-problems__rail-link"));
    var segs = Array.prototype.slice.call(section.querySelectorAll(".kzd-problems__seg"));
    var n = items.length;
    if (!n) return;
    var shortScreen = window.matchMedia("(max-height: 620px)");

    /* Header height -> --header-h on :root (sticky tops are built from it). */
    var nav = document.querySelector("header .navbar, header nav");
    function measureHeader() {
      document.documentElement.style.setProperty("--header-h", (nav ? nav.offsetHeight : 0) + "px");
    }
    measureHeader();

    /* Static list when stacking cannot show a whole card: short screens,
       reduced motion, or any card whose content outgrows the space left
       below its sticky top even after the fluid type scaling. */
    var isStatic = false;
    function decideMode() {
      section.classList.remove("problems--static");
      var tooTall = cards.some(function (c) { return c.scrollHeight > c.clientHeight + 1; });
      isStatic = reduced.matches || shortScreen.matches || tooTall;
      section.classList.toggle("problems--static", isStatic);
    }

    /* 1. Entrance ---------------------------------------------------------- */
    var ins = section.querySelectorAll(".kzd-problems__in");
    Array.prototype.forEach.call(ins, function (el, i) { el.style.setProperty("--d", i); });
    if (!reduced.matches && "IntersectionObserver" in window) {
      section.classList.add("is-armed");
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        section.classList.add("is-entered");
        obs.disconnect();
      }, { threshold: 0.15 }).observe(section);
    }

    // will-change only while the section is on screen; skip scroll work off screen
    var onscreen = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onscreen = entries[0].isIntersecting;
        section.classList.toggle("is-onscreen", onscreen);
        if (onscreen) schedule();
      }).observe(section);
    }

    /* 2. Rail + bar --------------------------------------------------------- */
    var active = -1;
    function setActive(i) {
      if (i === active) return;
      active = i;
      links.forEach(function (a, k) {
        var on = k === i;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
      });
      segs.forEach(function (s, k) { s.classList.toggle("is-done", k <= i); });
      section.style.setProperty("--fill", ((i + 1) / n).toFixed(3));
    }
    setActive(0);

    /* 3. Cover effect + active card, from live rects ------------------------ */
    // --p: the next card's top travelling from this card's bottom edge to the
    //      next card's own sticky top (0 until it actually overlaps).
    // --f: content fade, only in the last 40% of that overlap.
    function update() {
      ticking = false;
      if (isStatic) {
        // plain list: the active card is the last one whose top passed mid-screen
        var a = 0;
        for (var s = 0; s < n; s++) if (items[s].getBoundingClientRect().top < window.innerHeight * 0.5) a = s;
        setActive(a);
        return;
      }
      var tops = items.map(function (it) { return parseFloat(getComputedStyle(it).top); });
      var p = new Array(n);
      for (var i = 0; i < n; i++) {
        if (i === n - 1) { p[i] = 0; continue; }
        var r = items[i].getBoundingClientRect();
        var bottom = r.top + cards[i].offsetHeight;
        var nextTop = items[i + 1].getBoundingClientRect().top;
        var span = bottom - tops[i + 1];
        p[i] = span > 0 ? Math.max(0, Math.min(1, (bottom - nextTop) / span)) : (nextTop <= tops[i + 1] ? 1 : 0);
      }
      var act = 0;
      for (var k = 0; k < n; k++) {
        var q = k + 1 < n ? p[k + 1] : 0;
        var f = Math.max(0, Math.min(1, (p[k] - 0.6) / 0.4));
        items[k].style.setProperty("--p", p[k].toFixed(4));
        items[k].style.setProperty("--q", q.toFixed(4));
        items[k].style.setProperty("--f", f.toFixed(4));
        // card k becomes active once it covers at least half of card k-1
        if (k === 0 || p[k - 1] >= 0.5) act = k;
      }
      setActive(act);
    }
    var ticking = false;
    function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", function () { if (onscreen) schedule(); }, { passive: true });

    /* Resize (rAF-throttled) and header size changes re-measure; scrolling never does. */
    var resizing = false;
    function relayout() {
      resizing = false;
      measureHeader();
      decideMode();
      if (isStatic) items.forEach(function (it) { it.style.removeProperty("--p"); it.style.removeProperty("--q"); it.style.removeProperty("--f"); });
      update();
    }
    function onResize() { if (!resizing) { resizing = true; requestAnimationFrame(relayout); } }
    window.addEventListener("resize", onResize);
    if (nav && "ResizeObserver" in window) new ResizeObserver(onResize).observe(nav);
    if (shortScreen.addEventListener) shortScreen.addEventListener("change", onResize);
    if (reduced.addEventListener) reduced.addEventListener("change", onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
    relayout();

    /* Rail clicks: land with the card just stuck (stacking) or just below the
       header (static list), fully visible either way. */
    function scrollTarget(i) {
      if (isStatic) {
        return items[i].getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight : 0) - 16;
      }
      var gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      var y = list.getBoundingClientRect().top + window.scrollY;
      for (var k = 0; k < i; k++) y += items[k].offsetHeight + gap;
      return y - parseFloat(getComputedStyle(items[i]).top);
    }
    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var y = scrollTarget(+a.getAttribute("data-index"));
        if (lenis) lenis.scrollTo(y, { duration: 1.1 });
        else window.scrollTo({ top: y, behavior: reduced.matches ? "auto" : "smooth" });
        if (history.replaceState) history.replaceState(null, "", a.getAttribute("href"));
      });
    });
  }

  /* 4. Lenis ---------------------------------------------------------------- */
  function initLenis() {
    if (typeof window.Lenis !== "function" || reduced.matches || touchOnly.matches) return;

    lenis = new window.Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true
    });

    // Same-page anchor links land below the fixed header. (Lenis's own
    // anchors option is not used: it would also catch the rail links, which
    // scroll to a card's STUCK position, handled in initSection.)
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^=\"#\"]");
      if (!a || a.classList.contains("kzd-problems__rail-link") || e.defaultPrevented) return;
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -headerHeight() });
    });

    // Every modal here locks the page with body overflow:hidden, and the
    // mobile menu with .kzd-mnav-locked. Watch those instead of patching each
    // modal: stop Lenis while locked, start it again after.
    var paused = false;
    function sync() {
      var locked = document.body.style.overflow === "hidden" ||
        document.documentElement.classList.contains("kzd-mnav-locked") ||
        document.body.classList.contains("kzd-mnav-locked");
      if (locked && !paused) { paused = true; lenis.stop(); }
      else if (!locked && paused) { paused = false; lenis.start(); }
    }
    var mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    sync();

    // Turned on later (reduced motion switched on mid-visit)? Stop for good.
    if (reduced.addEventListener) reduced.addEventListener("change", function (e) { if (e.matches && lenis) { lenis.destroy(); lenis = null; } });
  }

  function init() { initLenis(); initSection(); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
