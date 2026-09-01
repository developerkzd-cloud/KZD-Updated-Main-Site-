/* ==========================================================================
   KZD Solutions — Footer
   Entry reveal only: the whole block rises 24px and fades in.
   Everything else (underline wipe, social lift, link shift) is CSS hover.

   Self-contained, transform/opacity only, honours prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  function init() {
    var footer = document.querySelector(".kzd-footer");
    if (!footer) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      footer.classList.add("is-in");
      return;
    }

    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        footer.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }).observe(footer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
