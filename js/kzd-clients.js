/* ==========================================================================
   KZD Solutions — Our Clients (dual marquee)
   Builds both tracks from a single logo array, then releases the animation
   when the section enters the viewport.

   Self-contained: no jQuery, no Swiper, no dependency on the theme's slider
   pipeline. Animation itself is pure CSS on the compositor (transform only);
   this file only generates markup and toggles .is-in.
   ========================================================================== */

(function () {
  "use strict";

  var BASE = "images/clients/";

  /* Display sizes, already normalised by optical area — the wide wordmarks and
     the square badges are meant to carry equal visual weight, which is why
     these are not a uniform height. Files are 2x these dimensions. */
  var LOGOS = [
    { name: "DUYS",                file: "duys.png",             w: 120, h: 37 },
    { name: "Lipton",              file: "lipton.png",           w: 56,  h: 56 },
    { name: "Oh Two Printing",     file: "oh-two-printing.png",  w: 86,  h: 51 },
    { name: "Computer Garden",     file: "computer-garden.png",  w: 151, h: 29 },
    { name: "ZA Gear",             file: "za-gear.png",          w: 96,  h: 46 },
    { name: "Adventist Education", file: "adventist.png",        w: 50,  h: 55 },
    { name: "Farmboy Farmgirl",    file: "farmboy-farmgirl.png", w: 119, h: 37 }
  ];

  /* Seven tiles is roughly 1400px — barely wider than a desktop viewport, which
     leaves a visible gap at large widths. Three sets per half (six per track)
     keeps the row full at any width. */
  var SETS_PER_HALF = 3;

  /* Masking is how the pale source art gets repainted. Detect once. */
  var CAN_MASK = typeof CSS !== "undefined" && CSS.supports &&
    (CSS.supports("mask-image", 'url("a.png")') ||
     CSS.supports("-webkit-mask-image", 'url("a.png")'));

  /**
   * @param {Object} logo
   * @param {boolean} hidden  duplicates are hidden from assistive tech so the
   *                          seven logos are announced exactly once
   * @returns {HTMLElement}
   */
  function makeTile(logo, hidden) {
    var tile = document.createElement("div");
    tile.className = "kzd-clients__tile";
    // Tile width: max(190, logoWidth + 60)
    tile.style.width = Math.max(190, logo.w + 60) + "px";

    var mark = document.createElement("span");
    mark.className = "kzd-clients__logo";
    mark.style.width = logo.w + "px";
    mark.style.height = logo.h + "px";

    /* Set inline, NOT via a custom property consumed in the stylesheet: a
       url() inside a custom property resolves against the stylesheet that
       substitutes it, which turned these into /css/images/clients/*.png. */
    var url = 'url("' + BASE + logo.file + '")';
    if (CAN_MASK) {
      mark.style.webkitMaskImage = url;
      mark.style.maskImage = url;
    } else {
      mark.classList.add("kzd-clients__logo--nomask");
      mark.style.backgroundImage = url;
    }

    if (hidden) {
      tile.setAttribute("aria-hidden", "true");
    } else {
      mark.setAttribute("role", "img");
      mark.setAttribute("aria-label", logo.name);
    }

    tile.appendChild(mark);
    return tile;
  }

  /**
   * Fill a track with six sets: three per half, so translateX(-50%) lands
   * exactly one whole period and the seam is invisible.
   * @param {HTMLElement} track
   * @param {number} offset  index the row starts at
   */
  function buildTrack(track, offset) {
    var order = LOGOS.slice(offset).concat(LOGOS.slice(0, offset));
    var frag = document.createDocumentFragment();

    for (var set = 0; set < SETS_PER_HALF * 2; set++) {
      for (var i = 0; i < order.length; i++) {
        // Only the very first set is exposed to screen readers.
        frag.appendChild(makeTile(order[i], set !== 0));
      }
    }
    track.appendChild(frag);
  }

  function init() {
    var section = document.querySelector(".kzd-clients");
    if (!section) return;

    var tracks = section.querySelectorAll(".kzd-clients__track");
    if (tracks.length < 2) return;

    buildTrack(tracks[0], 0);
    // Row 2 starts at index 3 — the offset stops the two rows reading as a
    // mirrored pair.
    buildTrack(tracks[1], 3);

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      section.classList.add("is-in");
      return;
    }

    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        section.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.2 }).observe(section);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
