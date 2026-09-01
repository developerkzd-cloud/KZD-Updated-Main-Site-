/* ==========================================================================
   KZD Solutions — About Us
   Entry animations for the section.

   Self-contained: no dependency on jQuery, the theme's data-anime pipeline, or
   any other script on the page. Animates transform and opacity only.

   Design rule throughout: the markup already carries the finished state. This
   script only ever pulls things back to a start position when it is certain it
   is going to animate them (it adds .kzd-about--anim to do so). No JS, blocked
   JS, no IntersectionObserver, or prefers-reduced-motion therefore all render
   the settled section with no flash of zeros.

   Every observer unobserves on first fire. Nothing replays on re-entry.
   ========================================================================== */

(function () {
  "use strict";

  var ROLL_MS      = 1400;   // one digit's full roll
  var ROLL_STAGGER = 100;    // settle offset, left -> right (spec: 90-120ms)
  var REEL_LENGTH  = 8;      // 7 random digits + the target as the last char
  var SETTLE_EASE  = "cubic-bezier(.16,1,.3,1)";

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Mark elements settled once their entry transition is done, so the CSS can
   * drop will-change. transitionend alone is not reliable — it never fires if
   * the transition is interrupted or coalesced — so a timeout backs it up.
   * @param {Element|NodeList|Array} els
   * @param {number} after ms after which to settle regardless
   */
  function settle(els, after) {
    var list = els.length !== undefined ? els : [els];
    Array.prototype.forEach.call(list, function (el) {
      var done = false;
      function mark() {
        if (done) return;
        done = true;
        el.classList.add("is-settled");
      }
      el.addEventListener("transitionend", mark, { once: true });
      window.setTimeout(mark, after);
    });
  }

  /**
   * Observe an element once, then stop watching it.
   * @param {Element} el
   * @param {number} threshold
   * @param {Function} onEnter
   */
  function once(el, threshold, onEnter) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        obs.disconnect();
        onEnter(entry.target);
      });
    }, { threshold: threshold, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
  }

  /* ------------------------------------------------------------------------
     Odometer

     Not a count-up. Each DIGIT is its own vertical reel inside a 1-digit-tall
     window with overflow hidden. The reel translates upward to land on its
     target, so mid-roll you see numerals cut horizontally — which is what makes
     it read mechanical rather than scripted.

     The reel is 7 RANDOM digits with the target as the 8th, regenerated on every
     page load. A sequential 0-9 ladder visibly counts, which telegraphs where it
     is going to stop; random digits give no such cue, so the landing reads as a
     stop rather than an arrival.
     ------------------------------------------------------------------------ */

  /**
   * A reel of REEL_LENGTH digits whose LAST character is `target`.
   * e.g. target 7 -> "30683467". Fresh randomness per digit, per load.
   * @param {number} target 0-9
   * @returns {string}
   */
  function reel(target) {
    var s = "";
    for (var i = 0; i < REEL_LENGTH - 1; i++) {
      s += String(Math.floor(Math.random() * 10));
    }
    return s + String(target);
  }

  /**
   * Replace a numeral's text with per-digit odometer columns and roll them.
   * Non-digit characters (R, M, +, %) are emitted as static text.
   * @param {Element} el element whose textContent is the target value
   */
  function roll(el) {
    var text = el.getAttribute("data-odo") || el.textContent;
    var frag = document.createDocumentFragment();
    var cols = [];

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);

      if (ch < "0" || ch > "9") {
        frag.appendChild(document.createTextNode(ch));
        continue;
      }

      var target = Number(ch);
      var win = document.createElement("span");
      win.className = "kzd-about__odo";

      // Hidden copy of the final digit — this alone sets the column's width.
      var ghost = document.createElement("span");
      ghost.className = "kzd-about__odo-ghost";
      ghost.textContent = ch;
      ghost.setAttribute("aria-hidden", "true");
      win.appendChild(ghost);

      var col = document.createElement("span");
      col.className = "kzd-about__odo-col";

      var strip = reel(target);
      for (var d = 0; d < strip.length; d++) {
        var digit = document.createElement("span");
        digit.textContent = strip.charAt(d);
        col.appendChild(digit);
      }

      win.appendChild(col);
      frag.appendChild(win);
      // Land on the last character of the reel, which is the target.
      cols.push({ col: col, last: strip.length - 1 });
    }

    if (!cols.length) return;

    // Swap in the odometer and animate in the same frame, so the real value is
    // on screen right up until the roll starts.
    el.textContent = "";

    // A screen reader should hear "1400+", not the digit ladder.
    var sr = document.createElement("span");
    sr.className = "kzd-about__sr";
    sr.textContent = text;
    el.appendChild(sr);

    var visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    visual.appendChild(frag);
    el.appendChild(visual);

    cols.forEach(function (item, idx) {
      var last  = item.last;
      var final = -last;
      // Travel linearly to two digits short of the target, then ease into it —
      // so the deceleration happens only over the final stretch.
      var pre   = -Math.max(last - 2, 0);

      var anim = item.col.animate(
        [
          { transform: "translateY(0em)", easing: "linear" },
          { transform: "translateY(" + pre + "em)", offset: .68, easing: SETTLE_EASE },
          { transform: "translateY(" + final + "em)" }
        ],
        {
          duration: ROLL_MS,
          delay: idx * ROLL_STAGGER,   // digits must not land together
          easing: "linear",
          fill: "forwards"
        }
      );

      var landed = false;
      function land() {
        if (landed) return;
        landed = true;
        // Commit the resting position and drop the compositor hint.
        try { anim.cancel(); } catch (e) { /* already gone */ }
        item.col.style.transform = "translateY(" + final + "em)";
        item.col.classList.add("is-settled");
      }

      anim.finished.then(land).catch(function () { /* cancelled */ });
      // Backstop: Animation.finished can stay pending if the tab is throttled.
      window.setTimeout(land, ROLL_MS + idx * ROLL_STAGGER + 400);
    });
  }

  /* ------------------------------------------------------------------------
     Percentage count-up — plain count-up is correct here, these are
     percentages rather than odometer figures. Matches the 900ms bar growth so
     digits and bar finish together.
     ------------------------------------------------------------------------ */

  /**
   * @param {Element} el
   */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count-to"), 10);
    if (isNaN(target)) return;

    var DURATION = 900;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) window.requestAnimationFrame(frame);
      else el.textContent = String(target);
    }

    el.textContent = "0";
    window.requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------------
     Brand block — scroll-linked reveal

     The block slides down out from behind the value cards while fading in, and
     retreats back up behind them on the way back. Scroll-linked rather than a
     one-shot observer, so reversing direction mid-animation tracks the scroll
     exactly instead of snapping.

     translateY and opacity only. No scale: the block's width and height are
     constant for the whole scroll — the emergence is sold by the mask's clip
     plus the vertical travel.

     Cost control: scroll/resize are passive and only raise a dirty flag; all
     measurement and writing happens in one rAF callback, with a single
     getBoundingClientRect per frame.
     ------------------------------------------------------------------------ */

  function brandReveal(section) {
    var mask  = section.querySelector(".kzd-about__brand-mask");
    var brand = section.querySelector(".kzd-about__brand");
    if (!mask || !brand) return;

    // Reduced motion: no listeners, no rAF loop, no clip. The CSS resting state
    // is already the final state, so there is nothing to render.
    if (reduced()) return;

    var travel = -68;   // percent of the block's own height
    var fade   = .30;
    var ticking = false;
    var hinted  = false;
    var lastP   = -1;

    function readTokens() {
      var cs = parseFloat(getComputedStyle(section).getPropertyValue("--kzd-brand-travel"));
      var cf = parseFloat(getComputedStyle(section).getPropertyValue("--kzd-brand-fade"));
      if (!isNaN(cs)) travel = cs;
      if (!isNaN(cf)) fade = cf;
    }

    function apply() {
      ticking = false;

      var rect = mask.getBoundingClientRect();          // the only layout read
      var vh   = window.innerHeight;

      var start = vh * 0.88;
      var end   = vh * 0.52;
      var raw   = (start - rect.top) / (start - end);
      var p     = Math.min(1, Math.max(0, raw));

      // Snap the ends. Floating point leaves p at 0.99999998 at the top of the
      // band, which would keep the block flagged "moving" forever and never let
      // the compositor hint be released.
      if (p > .999) p = 1;
      else if (p < .001) p = 0;

      var e     = 1 - Math.pow(1 - p, 3);               // easeOutCubic

      if (p === lastP) return;
      lastP = p;

      // Hint the compositor only while the block is actually in motion.
      var moving = p > 0 && p < 1;
      if (moving && !hinted) {
        brand.style.willChange = "transform, opacity";
        hinted = true;
      } else if (!moving && hinted) {
        brand.style.willChange = "auto";
        hinted = false;
      }

      brand.style.transform = "translate3d(0, " + (travel * (1 - e)) + "%, 0)";
      brand.style.opacity = fade + (1 - fade) * e;
    }

    function request() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", function () {
      readTokens();
      lastP = -1;                 // breakpoint may have changed travel/fade
      request();
    }, { passive: true });
    window.addEventListener("orientationchange", function () {
      readTokens();
      lastP = -1;
      request();
    }, { passive: true });

    // Settle the state before the first paint, so a page loaded already scrolled
    // to this section renders correctly with no flash and no wait for a scroll.
    readTokens();
    apply();
  }

  /* --------------------------------------------------------------------- */

  function init() {
    var section = document.querySelector(".kzd-about");
    if (!section) return;

    // The brand reveal is scroll-driven and needs no IntersectionObserver, so
    // it is wired up before the observer check. It opts out of reduced motion
    // itself.
    brandReveal(section);

    // No observer support, or the user asked for less motion: the markup is
    // already the finished state, so leave it entirely alone.
    if (reduced() || !("IntersectionObserver" in window)) return;

    // From here on we are animating, so it is safe to pull elements back.
    section.classList.add("kzd-about--anim");

    /* Block 1 — panel scales 1.03 -> 1 while fading in. */
    var panel = section.querySelector(".kzd-about__panel");
    if (panel) {
      once(panel, .15, function (el) {
        el.classList.add("is-in");
        settle(el, 1200);
      });
    }

    /* Block 1 — right column rises 16px, staggered 90ms in reading order. */
    var rises = section.querySelectorAll(".kzd-about__rise");
    Array.prototype.forEach.call(rises, function (el, i) {
      el.style.setProperty("--kzd-delay", (i * 90) + "ms");
    });
    var copy = section.querySelector(".kzd-about__copy");
    if (copy) {
      once(copy, .2, function () {
        Array.prototype.forEach.call(rises, function (el) {
          el.classList.add("is-in");
        });
        settle(rises, 1400);
      });
    }

    /* Block 1 — 98% / 85% count up while the blue bars grow from scaleX(0). */
    var stats = section.querySelector(".kzd-about__stats");
    if (stats) {
      once(stats, .3, function (el) {
        el.classList.add("is-in");
        Array.prototype.forEach.call(
          el.querySelectorAll(".kzd-about__stat-num"), countUp
        );
        settle(el.querySelectorAll(".kzd-about__bar"), 1300);
      });
    }

    /* Block 2 — the odometer. Fires once, per metric. */
    var metrics = section.querySelectorAll(".kzd-about__metric-value");
    Array.prototype.forEach.call(metrics, function (el) {
      once(el, .5, roll);
    });

    /* Block 3 — cards rise 20px + fade, staggered 80ms in reading order. */
    var cards = section.querySelectorAll(".kzd-about__card");
    Array.prototype.forEach.call(cards, function (el, i) {
      el.style.setProperty("--kzd-delay", (i * 80) + "ms");
    });
    var values = section.querySelector(".kzd-about__values");
    if (values) {
      once(values, .15, function () {
        Array.prototype.forEach.call(cards, function (el) {
          el.classList.add("is-in");
        });
        settle(cards, 1400);
      });
    }

    /* Block 4 is handled by brandReveal(), wired up above. It is scroll-linked
       rather than an observer: it has to track the scroll in both directions
       rather than fire once. */
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
