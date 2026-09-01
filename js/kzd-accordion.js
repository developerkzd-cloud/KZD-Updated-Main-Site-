/* ==========================================================================
   KZD Solutions — Services accordion (Services page)

   Self-contained: no jQuery, no theme dependency. The animation itself is pure
   CSS driven by an .is-open class toggle — this file never animates a value,
   it only decides which panel is open and keeps the ARIA in step.

   Both panels stay fully in the DOM with all their content at all times.
   Nothing is mounted, injected or destroyed on hover.

   Below the stack breakpoint the hover mechanic is REMOVED, not disabled: the
   listeners are detached and both panels are left open. There is no hover on a
   phone, so an accordion there is a control that does not work.
   ========================================================================== */

(function () {
  "use strict";

  var STACK_QUERY = "(max-width: 900px)";
  var ROW_STAGGER = 40;   // ms between list rows, after the expand delay
  var ROW_DELAY   = 220;  // ms before the expanding panel's content appears

  function init() {
    var section = document.querySelector(".kzd-acc");
    if (!section) return;

    var panels = Array.prototype.slice.call(
      section.querySelectorAll(".kzd-acc__panel")
    );
    if (panels.length < 2) return;

    var toggles = panels.map(function (p) {
      return p.querySelector(".kzd-acc__toggle");
    });
    var bodies = panels.map(function (p) {
      return p.querySelector(".kzd-acc__body");
    });

    /* Stagger is per-row and set once; the delay only applies while opening. */
    panels.forEach(function (p) {
      var rows = p.querySelectorAll(".kzd-acc__row");
      Array.prototype.forEach.call(rows, function (row, i) {
        row.style.setProperty("--kzd-a-delay", (ROW_DELAY + i * ROW_STAGGER) + "ms");
      });
    });

    var stacked = window.matchMedia(STACK_QUERY);
    var bound = false;
    var openIndex = 0;   // default on first load only; never reset afterwards

    /* Arriving from the nav's Services > Consulting / Development links, open
       the panel that was asked for rather than the default. */
    (function fromHash() {
      var id = (window.location.hash || "").replace("#", "");
      if (!id) return;
      for (var i = 0; i < panels.length; i++) {
        if (panels[i].id === id) { openIndex = i; return; }
      }
    })();

    /**
     * Hide the collapsed panel's content from assistive tech so the two lists
     * are never announced at once, and its CTA cannot be tabbed to.
     * @param {Element} body
     * @param {boolean} hidden
     */
    function setHidden(body, hidden) {
      if (!body) return;
      if ("inert" in HTMLElement.prototype) {
        body.inert = hidden;
      } else {
        // Older engines: aria-hidden plus removing the link from tab order.
        var links = body.querySelectorAll("a[href], button");
        Array.prototype.forEach.call(links, function (l) {
          if (hidden) l.setAttribute("tabindex", "-1");
          else l.removeAttribute("tabindex");
        });
      }
      body.setAttribute("aria-hidden", hidden ? "true" : "false");
    }

    /**
     * @param {number} i panel to expand
     */
    function open(i) {
      openIndex = i;
      panels.forEach(function (p, n) {
        var isOpen = n === i;
        p.classList.toggle("is-open", isOpen);
        if (toggles[n]) toggles[n].setAttribute("aria-expanded", isOpen ? "true" : "false");
        setHidden(bodies[n], !isOpen);
      });
    }

    /** Stacked: everything open, nothing hidden, nothing collapsible. */
    function openAll() {
      panels.forEach(function (p, n) {
        p.classList.add("is-open");
        if (toggles[n]) toggles[n].setAttribute("aria-expanded", "true");
        setHidden(bodies[n], false);
      });
    }

    /* --- handlers, attached only while the accordion is live -------------- */

    var handlers = [];

    function onEnter(i) {
      return function () { if (i !== openIndex) open(i); };
    }
    function onFocus(i) {
      return function () { if (i !== openIndex) open(i); };
    }
    function onClick(i) {
      return function () { if (i !== openIndex) open(i); };
    }
    function onKey(i) {
      return function (e) {
        var next = -1;
        if (e.key === "ArrowRight") next = (i + 1) % panels.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + panels.length) % panels.length;
        else return;
        e.preventDefault();
        open(next);
        if (toggles[next]) toggles[next].focus();
      };
    }

    function bind() {
      if (bound) return;
      bound = true;
      panels.forEach(function (p, i) {
        var h = {
          el: p,
          enter: onEnter(i),
          click: onClick(i),
          focus: onFocus(i),
          key: onKey(i)
        };
        // Hover on the panel; focus/keys on the button inside it.
        p.addEventListener("mouseenter", h.enter);
        p.addEventListener("click", h.click);          // touch: tap to expand
        if (toggles[i]) {
          toggles[i].addEventListener("focus", h.focus);
          toggles[i].addEventListener("keydown", h.key);
        }
        handlers.push(h);
      });
      open(openIndex);   // hold whatever was last open, not the default
    }

    function unbind() {
      if (!bound) return;
      bound = false;
      handlers.forEach(function (h, i) {
        h.el.removeEventListener("mouseenter", h.enter);
        h.el.removeEventListener("click", h.click);
        if (toggles[i]) {
          toggles[i].removeEventListener("focus", h.focus);
          toggles[i].removeEventListener("keydown", h.key);
        }
      });
      handlers.length = 0;
    }

    function apply() {
      if (stacked.matches) {
        unbind();
        openAll();
      } else {
        bind();
      }
    }

    apply();

    if (stacked.addEventListener) stacked.addEventListener("change", apply);
    else if (stacked.addListener) stacked.addListener(apply);

    /* Deliberately NO mouseleave handler on the section: when the pointer
       leaves, the panels hold whatever was last hovered. The Consulting default
       applies on first load only. Same for focus leaving the section. */
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
