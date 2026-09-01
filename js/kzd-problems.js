/* ==========================================================================
   KZD Solutions — Problems We Solve (bento grid)
   Entry animation.

   Self-contained: no jQuery, no dependency on the theme's data-anime pipeline.
   Animates transform and opacity only. The per-cell stagger and the 120ms
   caption offset both live in CSS (transition-delay driven by --kzd-p-i); this
   only decides when to add .is-in.
   ========================================================================== */

(function () {
  "use strict";

  function init() {
    var section = document.querySelector(".kzd-problems");
    if (!section) return;

    var cells = section.querySelectorAll(".kzd-problems__cell");
    if (!cells.length) return;

    function showAll() {
      Array.prototype.forEach.call(cells, function (c) { c.classList.add("is-in"); });
    }

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    // One observer on the grid: the cells are a single composition, so they
    // should cascade together rather than each firing on its own edge.
    var grid = section.querySelector(".kzd-problems__grid") || section;

    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        showAll();
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }).observe(grid);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
