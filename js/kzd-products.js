/* ==========================================================================
   KZD Solutions — Our Products (Services page)
   Entry animation only: the hover treatment is entirely CSS.

   Self-contained. main.js carries no IntersectionObserver helper — it is a
   jQuery/anime.js theme file driven by data-anime attributes — so this uses the
   same self-contained observer pattern as the other kzd-* sections.

   Animates transform and opacity only. Fires once and unobserves.
   ========================================================================== */

(function () {
  "use strict";

  var STAGGER = 90;   // ms between cards

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function init() {
    var section = document.querySelector(".kzd-prod");
    if (!section) return;

    var grid = section.querySelector(".kzd-prod__grid");
    if (!grid) return;

    var cards = grid.querySelectorAll(".kzd-prod__card");
    if (!cards.length) return;

    // The markup already renders the finished state, so with reduced motion or
    // no observer support there is nothing to do.
    if (reduced() || !("IntersectionObserver" in window)) return;

    section.classList.add("kzd-prod--anim");

    Array.prototype.forEach.call(cards, function (card, i) {
      card.style.setProperty("--kzd-p-delay", (i * STAGGER) + "ms");
    });

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        obs.disconnect();                 // fires once, never replays
        grid.classList.add("is-in");

        // Hand the transform back to the hover rule once the rise has landed,
        // otherwise the entry transition would still own it.
        var last = (cards.length - 1) * STAGGER + 620 + 60;
        window.setTimeout(function () {
          Array.prototype.forEach.call(cards, function (c) {
            c.classList.add("is-settled");
          });
        }, last);
      });
    }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });

    io.observe(grid);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
