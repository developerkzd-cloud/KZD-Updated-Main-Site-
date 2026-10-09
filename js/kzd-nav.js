/* ==========================================================================
   KZD Solutions — shared navigation behaviour
   Loaded by EVERY page. One copy; the markup is duplicated per page but this
   is not.

   Desktop: the Services panel opens on hover and on focus.
   Mobile (<=991px, inside the hamburger): it opens on tap instead, and the
   trigger toggles rather than following a link.
   Keyboard everywhere: Enter/Space toggles, Escape closes and returns focus to
   the trigger, Down/Up move through the panel's links, Home/End jump to the
   ends, Tab out closes.
   ========================================================================== */

(function () {
  "use strict";

  var MOBILE = "(max-width: 991px)";

  function init() {
    var items = document.querySelectorAll(".kzd-nav-item");
    if (!items.length) return;

    var mq = window.matchMedia(MOBILE);

    Array.prototype.forEach.call(items, function (item) {
      var trigger = item.querySelector(".kzd-nav-trigger");
      var panel = item.querySelector(".kzd-nav-mega");
      if (!trigger || !panel) return;

      var links = panel.querySelectorAll("a");

      function open() {
        if (item.classList.contains("is-open")) return;
        closeOthers();
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }

      function close() {
        if (!item.classList.contains("is-open")) return;
        item.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }

      function closeOthers() {
        Array.prototype.forEach.call(items, function (other) {
          if (other === item) return;
          var t = other.querySelector(".kzd-nav-trigger");
          other.classList.remove("is-open");
          if (t) t.setAttribute("aria-expanded", "false");
        });
      }

      item._kzdClose = close;

      /* --- pointer ------------------------------------------------------- */

      item.addEventListener("mouseenter", function () {
        if (!mq.matches) open();
      });
      item.addEventListener("mouseleave", function () {
        if (!mq.matches) close();
      });

      trigger.addEventListener("click", function (e) {
        // The trigger is a button, so it never navigates. On desktop it simply
        // toggles too, which is what a keyboard or touch user expects.
        e.preventDefault();
        if (item.classList.contains("is-open")) close();
        else open();
      });

      /* --- keyboard ------------------------------------------------------ */

      trigger.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          open();
          if (links.length) links[0].focus();
        } else if (e.key === "Escape") {
          close();
        }
      });

      // Opening on focus matches the hover behaviour for keyboard users.
      trigger.addEventListener("focus", function () {
        if (!mq.matches) open();
      });

      panel.addEventListener("keydown", function (e) {
        var list = Array.prototype.slice.call(links);
        var i = list.indexOf(document.activeElement);

        if (e.key === "Escape") {
          e.preventDefault();
          close();
          trigger.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          list[(i + 1) % list.length].focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          list[(i - 1 + list.length) % list.length].focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          list[0].focus();
        } else if (e.key === "End") {
          e.preventDefault();
          list[list.length - 1].focus();
        }
      });

      // Tabbing or clicking away closes it.
      item.addEventListener("focusout", function (e) {
        if (!item.contains(e.relatedTarget)) close();
      });
    });

    document.addEventListener("click", function (e) {
      Array.prototype.forEach.call(items, function (item) {
        if (!item.contains(e.target) && item._kzdClose) item._kzdClose();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      Array.prototype.forEach.call(items, function (item) {
        if (item._kzdClose) item._kzdClose();
      });
    });

    // Switching between the hover and tap models should not leave one stuck.
    function reset() {
      Array.prototype.forEach.call(items, function (item) {
        if (item._kzdClose) item._kzdClose();
      });
    }
    if (mq.addEventListener) mq.addEventListener("change", reset);
    else if (mq.addListener) mq.addListener(reset);
  }

  /* ========================================================================
     MOBILE PANEL

     Built at runtime from the page's existing #navbarNav, so the nav markup
     stays the single source of truth and no page HTML had to change. The
     theme's [data-mobile-nav-style=full-screen-menu] path is switched off —
     see the block comment in css/kzd-nav.css for why it was unusable.
     ======================================================================== */

  var SVG = "http://www.w3.org/2000/svg";

  /* Bootstrap Icons sprite (Assets/icons/kzd-icons.svg): the one icon family
     on the site. Pass "#name" wherever path data used to go. */
  function glyph(name, cls) {
    var s = document.createElementNS(SVG, "svg");
    s.setAttribute("class", "kzd-icon" + (cls ? " " + cls : ""));
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    var u = document.createElementNS(SVG, "use");
    u.setAttribute("href", "/Assets/icons/kzd-icons.svg#" + name);
    s.appendChild(u);
    return s;
  }

  function svg(paths, cls) {
    if (typeof paths === "string" && paths.charAt(0) === "#") return glyph(paths.slice(1), cls);
    var s = document.createElementNS(SVG, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    if (cls) s.setAttribute("class", cls);
    paths.forEach(function (d) {
      var p = document.createElementNS(SVG, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Same page? Compare resolved pathnames, so "index.html" and "/" both match.
  function isCurrent(href) {
    if (!href) return false;
    try {
      var a = new URL(href, location.href);
      if (a.origin !== location.origin) return false;
      var mine = location.pathname.replace(/\/$/, "/index.html");
      var theirs = a.pathname.replace(/\/$/, "/index.html");
      return mine === theirs;
    } catch (e) { return false; }
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initMobile() {
    var source = document.querySelector("#navbarNav");
    var toggler = document.querySelector(".navbar .navbar-toggler");
    if (!source || !toggler || document.querySelector(".kzd-mnav")) return;

    /* --- retire the theme's panel ---------------------------------------- */
    // js/main.js clones the toggler AND the collapse into this wrapper; that
    // clone is the second close button. Remove it outright.
    var themeInner = document.querySelector(".navbar-full-screen-menu-inner");
    if (themeInner && themeInner.parentNode) themeInner.parentNode.removeChild(themeInner);

    // Stop Bootstrap opening the old collapse; we handle the click ourselves.
    toggler.removeAttribute("data-bs-toggle");
    toggler.removeAttribute("data-bs-target");
    toggler.removeAttribute("data-target");
    toggler.setAttribute("aria-controls", "kzd-mnav");
    toggler.setAttribute("aria-expanded", "false");

    /* --- build ------------------------------------------------------------ */

    var scrim = el("div", "kzd-mnav-scrim");
    var panel = el("div", "kzd-mnav");
    panel.id = "kzd-mnav";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Menu");

    // Header
    var head = el("div", "kzd-mnav__head");
    var brand = el("a", "kzd-mnav__brand");
    brand.href = "index.html";
    var mark = el("img", "kzd-mnav__mark");
    mark.src = "Assets/logos/kzd-mark.png";
    mark.alt = "";
    mark.width = 96; mark.height = 95;
    brand.appendChild(mark);
    brand.appendChild(el("span", "kzd-mnav__word", "KZD Solutions"));
    head.appendChild(brand);

    var close = el("button", "kzd-mnav__close");
    close.type = "button";
    close.setAttribute("aria-label", "Close menu");
    close.appendChild(svg("#x-lg"));
    head.appendChild(close);
    panel.appendChild(head);

    // List
    var body = el("nav", "kzd-mnav__body");
    body.setAttribute("aria-label", "Main");
    var list = el("ul", "kzd-mnav__list");

    var actionHrefs = [];

    Array.prototype.forEach.call(source.querySelectorAll(":scope > .navbar-nav > .nav-item"), function (li) {
      var mega = li.querySelector(".kzd-nav-mega");
      var row = el("li", "kzd-mnav__item");

      if (mega) {
        var trigger = el("button", "kzd-mnav__link kzd-mnav__trigger");
        trigger.type = "button";
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-controls", "kzd-mnav-sub");
        trigger.appendChild(document.createTextNode("Services"));
        trigger.appendChild(svg("#chevron-down", "kzd-mnav__caret"));
        row.appendChild(trigger);

        var wrap = el("div", "kzd-mnav__subwrap");
        wrap.id = "kzd-mnav-sub";
        var sub = el("div", "kzd-mnav__sub");

        Array.prototype.forEach.call(mega.querySelectorAll(".kzd-nav-group"), function (g) {
          var h = g.querySelector(".kzd-nav-head");
          if (h) sub.appendChild(el("p", "kzd-mnav__grouphead", h.textContent.trim()));
          var ul = el("ul");
          Array.prototype.forEach.call(g.querySelectorAll("a"), function (a) {
            var li2 = el("li");
            var link = el("a", "kzd-mnav__sublink", a.textContent.trim());
            link.href = a.getAttribute("href");
            if (isCurrent(link.href)) link.setAttribute("aria-current", "page");
            li2.appendChild(link);
            ul.appendChild(li2);
          });
          sub.appendChild(ul);
        });

        wrap.appendChild(sub);
        row.appendChild(wrap);
        list.appendChild(row);
        return;
      }

      var a = li.querySelector("a.nav-link");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      var label = a.textContent.trim();

      // Login / Register are actions, not destinations — they move to the foot.
      if (/login|signup|register/i.test(href) || /^(login|register)$/i.test(label)) {
        if (!actionHrefs.some(function (x) { return x.label === label; })) {
          actionHrefs.push({ label: label, href: href });
        }
        return;
      }

      var link = el("a", "kzd-mnav__link", label);
      link.href = href;
      if (isCurrent(href)) link.setAttribute("aria-current", "page");
      row.appendChild(link);
      list.appendChild(row);
    });

    body.appendChild(list);
    panel.appendChild(body);

    // Actions
    var actions = el("div", "kzd-mnav__actions");
    panel.appendChild(actions);

    function paintActions() {
      actions.innerHTML = "";
      var auth = window.KZDAuth;
      var session = auth && auth.isSignedIn && auth.isSignedIn() ? auth.session() : null;

      if (session) {
        var who = el("p", "kzd-mnav__who");
        who.appendChild(document.createTextNode("Signed in as "));
        var b = el("b", null, session.firstName || session.email || "you");
        who.appendChild(b);
        actions.appendChild(who);

        var out = el("button", "kzd-mnav__btn kzd-mnav__btn--ghost", "Sign out");
        out.type = "button";
        out.addEventListener("click", function () {
          if (auth && auth.signOut) auth.signOut();
          paintActions();
        });
        actions.appendChild(out);
        return;
      }

      actionHrefs.forEach(function (x, i) {
        var btn = el("a", "kzd-mnav__btn " + (i === 0 ? "kzd-mnav__btn--ghost" : "kzd-mnav__btn--ember"), x.label);
        btn.href = x.href;
        actions.appendChild(btn);
      });
    }
    paintActions();

    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    /* --- submenu ---------------------------------------------------------- */

    var trig = panel.querySelector(".kzd-mnav__trigger");
    var wrapEl = panel.querySelector(".kzd-mnav__subwrap");

    if (trig && wrapEl) {
      trig.addEventListener("click", function () {
        var open = trig.getAttribute("aria-expanded") === "true";
        trig.setAttribute("aria-expanded", open ? "false" : "true");

        if (open) {
          if (reducedMotion()) { wrapEl.style.height = "0px"; return; }
          wrapEl.style.height = wrapEl.scrollHeight + "px";
          requestAnimationFrame(function () { wrapEl.style.height = "0px"; });
          return;
        }

        // Height is not animated (the design system animates transform and
        // opacity only), so the sub-list opens straight to its natural height.
        wrapEl.style.height = "auto";

        // The panel scrolls, so make sure the tail of the list is reachable.
        window.setTimeout(function () {
          var pr = body.getBoundingClientRect();
          var sr = wrapEl.getBoundingClientRect();
          if (sr.bottom > pr.bottom) {
            body.scrollTo({
              top: body.scrollTop + (sr.bottom - pr.bottom) + 16,
              behavior: reducedMotion() ? "auto" : "smooth"
            });
          }
        }, reducedMotion() ? 0 : 260);
      });

      // Let it grow naturally once open, so rotation/resize cannot clip it.
      wrapEl.addEventListener("transitionend", function (e) {
        if (e.propertyName !== "height") return;
        if (trig.getAttribute("aria-expanded") === "true") wrapEl.style.height = "auto";
      });
    }

    /* --- open / close ----------------------------------------------------- */

    var lastFocus = null;

    function focusables() {
      return Array.prototype.filter.call(
        panel.querySelectorAll('a[href], button:not([disabled])'),
        function (n) { return n.offsetWidth > 0 || n.offsetHeight > 0; }
      );
    }

    function openPanel() {
      if (panel.classList.contains("is-open")) return;
      lastFocus = document.activeElement;
      scrim.classList.add("is-open");
      panel.classList.add("is-open");
      toggler.setAttribute("aria-expanded", "true");
      document.documentElement.classList.add("kzd-mnav-locked");
      document.body.classList.add("kzd-mnav-locked");
      paintActions();
      var f = focusables();
      if (f.length) f[0].focus();
    }

    function closePanel() {
      if (!panel.classList.contains("is-open")) return;
      scrim.classList.remove("is-open");
      panel.classList.remove("is-open");
      toggler.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("kzd-mnav-locked");
      document.body.classList.remove("kzd-mnav-locked");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    panel._kzdOpen = openPanel;
    panel._kzdClose = closePanel;

    toggler.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (panel.classList.contains("is-open")) closePanel();
      else openPanel();
    });

    close.addEventListener("click", closePanel);
    scrim.addEventListener("click", closePanel);

    // Following a link inside the panel should not leave it open behind you.
    panel.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a[href]") : null;
      if (a && !a.classList.contains("kzd-mnav__brand")) closePanel();
    });

    document.addEventListener("keydown", function (e) {
      if (!panel.classList.contains("is-open")) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
        if (toggler.focus) toggler.focus();
        return;
      }

      if (e.key !== "Tab") return;

      // Trap.
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];

      if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Crossing to desktop must not leave the page scroll-locked.
    var wide = window.matchMedia("(min-width: 992px)");
    function onWide(ev) { if (ev.matches) closePanel(); }
    if (wide.addEventListener) wide.addEventListener("change", onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  function boot() {
    init();
    initMobile();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // main.js builds its clone wrapper inside jQuery's ready handler, which may
  // land after ours. Sweep it once more after load.
  window.addEventListener("load", function () {
    var themeInner = document.querySelector(".navbar-full-screen-menu-inner");
    if (themeInner && themeInner.parentNode) themeInner.parentNode.removeChild(themeInner);
    initMobile();
  });
})();
