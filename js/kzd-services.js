/* ==========================================================================
   KZD Solutions — Services (homepage, option A)

   1. Entrance (once, IntersectionObserver at 0.2).
   2. Desktop list: one active row (hover or keyboard focus) and a decorative
      preview card that follows the cursor with a lerp. The rAF loop runs only
      while the card is catching up, then stops.
   3. Accordion (touch / < 1024px): one row open at a time; closed panels are
      inert so Tab and screen readers skip them.
   Visual states live in css/kzd-services.css. No dependencies.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktop = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");

  function init() {
    var section = document.querySelector(".kzd-services");
    if (!section) return;
    var main = section.querySelector(".kzd-services__main");
    var rows = Array.prototype.slice.call(section.querySelectorAll(".kzd-services__row"));
    var card = section.querySelector(".kzd-services__preview");
    var blocks = Array.prototype.slice.call(section.querySelectorAll(".kzd-services__pv"));
    var items = Array.prototype.slice.call(section.querySelectorAll(".kzd-services__acc-item"));

    /* 1. Entrance -------------------------------------------------------- */
    Array.prototype.forEach.call(section.querySelectorAll(".kzd-services__in"), function (el, i) { el.style.setProperty("--d", i); });
    section.querySelectorAll(".kzd-services__li").forEach(function (el, i) { el.style.setProperty("--d", i); });
    items.forEach(function (el, i) { el.style.setProperty("--d", i); });
    if (!reduced.matches && "IntersectionObserver" in window) {
      section.classList.add("is-armed");
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        section.classList.add("is-entered");
        obs.disconnect();
      }, { threshold: 0.2 }).observe(section);
    }

    /* 2. Desktop list + preview card ------------------------------------- */
    var active = -1;
    function setActive(i) {
      if (i === active) return;
      active = i;
      rows.forEach(function (r, k) { r.classList.toggle("is-active", k === i); });
      if (i >= 0) blocks.forEach(function (b, k) { b.classList.toggle("is-shown", k === i); });
    }

    var cur = { x: 0, y: 0 }, target = { x: 0, y: 0 }, raf = 0, placed = false;
    function apply() { card.style.setProperty("--x", cur.x.toFixed(1) + "px"); card.style.setProperty("--y", cur.y.toFixed(1) + "px"); }
    function step() {
      raf = 0;
      cur.x += (target.x - cur.x) * 0.15;
      cur.y += (target.y - cur.y) * 0.15;
      if (Math.abs(target.x - cur.x) < 0.5 && Math.abs(target.y - cur.y) < 0.5) { cur.x = target.x; cur.y = target.y; apply(); return; }
      apply();
      raf = requestAnimationFrame(step);
    }
    // keep the card inside the section and on screen
    function clampTo(x, y) {
      var m = main.getBoundingClientRect(), s = section.getBoundingClientRect();
      var w = card.offsetWidth, h = card.offsetHeight;
      var maxX = Math.min(s.right, document.documentElement.clientWidth) - m.left - w - 8;
      var minX = s.left - m.left + 8;
      var minY = s.top - m.top + 8, maxY = s.bottom - m.top - h - 8;
      return { x: Math.max(minX, Math.min(maxX, x)), y: Math.max(minY, Math.min(maxY, y)) };
    }
    function moveTo(x, y) {
      target = clampTo(x, y);
      if (!placed || reduced.matches) { cur.x = target.x; cur.y = target.y; placed = true; apply(); return; }
      if (!raf) raf = requestAnimationFrame(step);
    }
    function show(on) {
      card.classList.toggle("is-shown", on);
      if (!on) { placed = false; setActive(-1); }
    }

    var list = section.querySelector(".kzd-services__list");
    list.addEventListener("pointermove", function (e) {
      if (!desktop.matches || e.pointerType !== "mouse") return;
      var row = e.target.closest && e.target.closest(".kzd-services__row");
      if (row) setActive(+row.getAttribute("data-index"));
      var m = main.getBoundingClientRect();
      moveTo(e.clientX - m.left + 24, e.clientY - m.top + 24);
      show(true);
    }, { passive: true });
    list.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse") return;
      if (list.contains(document.activeElement) && document.activeElement.matches(":focus-visible")) return;
      show(false);
    });

    // Keyboard: the focused row is active and the card sits beside it.
    list.addEventListener("focusin", function (e) {
      var row = e.target.closest(".kzd-services__row");
      if (!row || !row.matches(":focus-visible")) return;
      setActive(+row.getAttribute("data-index"));
      if (!desktop.matches) return;
      var m = main.getBoundingClientRect(), r = row.getBoundingClientRect();
      placed = false;
      moveTo(r.right - m.left - card.offsetWidth - 72, r.bottom - m.top - 12);
      show(true);
    });
    list.addEventListener("focusout", function (e) {
      if (list.contains(e.relatedTarget)) return;
      show(false);
    });
    window.addEventListener("scroll", function () { if (card.classList.contains("is-shown") && !list.matches(":hover") && !list.contains(document.activeElement)) show(false); }, { passive: true });

    /* 3. Accordion -------------------------------------------------------- */
    function openItem(i) {
      items.forEach(function (it, k) {
        var on = k === i;
        it.classList.toggle("is-open", on);
        it.querySelector(".kzd-services__acc-btn").setAttribute("aria-expanded", on ? "true" : "false");
        var panel = it.querySelector(".kzd-services__acc-panel");
        if (on) panel.removeAttribute("inert"); else panel.setAttribute("inert", "");
      });
    }
    items.forEach(function (it, i) {
      it.querySelector(".kzd-services__acc-btn").addEventListener("click", function () {
        openItem(it.classList.contains("is-open") ? -1 : i);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
