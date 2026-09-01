/* ==========================================================================
   KZD Solutions — Services
   Card reveal, icon draw-in, and the carousel arrows.

   Self-contained: no jQuery, no dependency on the theme's slider pipeline.
   The stagger and the icon draw live in CSS (transition-delay driven by
   --kzd-s-i); this decides when to add .is-in and drives the scroll track.
   ========================================================================== */

(function () {
  "use strict";

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function init() {
    var section = document.querySelector(".kzd-services");
    if (!section) return;

    var row = section.querySelector(".kzd-services__row");
    var cards = section.querySelectorAll(".kzd-services__card");
    var prev = section.querySelector(".kzd-services__arrow--prev");
    var next = section.querySelector(".kzd-services__arrow--next");
    if (!row || !cards.length) return;

    /* ---- reveal --------------------------------------------------------- */

    function showAll() {
      Array.prototype.forEach.call(cards, function (c) { c.classList.add("is-in"); });
    }

    if (reduced() || !("IntersectionObserver" in window)) {
      showAll();
    } else {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          showAll();
          obs.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }).observe(row);
    }

    /* ---- arrows --------------------------------------------------------- */

    /** One card plus one gap — how far a single advance moves the track. */
    function step() {
      var first = cards[0];
      if (!first) return 0;
      var gap = parseFloat(getComputedStyle(row).columnGap) || 24;
      return first.getBoundingClientRect().width + gap;
    }

    /**
     * With three cards and three visible there is nothing to advance to, so
     * the arrows are disabled rather than left as dead controls. They come
     * alive as soon as the row actually overflows.
     */
    function syncArrows() {
      if (!prev || !next) return;
      var max = row.scrollWidth - row.clientWidth;
      var overflowing = max > 2;
      var x = row.scrollLeft;
      prev.disabled = !overflowing || x <= 2;
      next.disabled = !overflowing || x >= max - 2;
    }

    function advance(dir) {
      row.scrollBy({ left: dir * step(), behavior: reduced() ? "auto" : "smooth" });
    }

    if (prev) prev.addEventListener("click", function () { advance(-1); });
    if (next) next.addEventListener("click", function () { advance(1); });

    row.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);

    // Fonts landing changes card widths, so re-check once they are ready.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncArrows);
    }
    syncArrows();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
