/* ==========================================================================
   KZD Solutions — Testimonials

   Self-contained: no jQuery, no theme data-anime pipeline, no other script on
   the page. Reads reviews.json at runtime with fetch() — no Google Places API,
   no key, no backend, no per-request cost.

   Animates transform and opacity only. Every observer unobserves on first fire.
   Fully honours prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  var SRC = "reviews.json";

  /* Avatar tones, cycled by index: navy and grey tokens, each >= 5.3:1
     against the white initials. */
  var TONES = ["var(--kzd-navy-400)", "var(--kzd-gray)", "var(--kzd-navy-500)", "var(--kzd-charcoal)", "var(--kzd-navy-300)"];

  var SWIPE_DISTANCE = 40;    // px before a drag commits to a page change
  var SWIPE_VELOCITY = .45;   // px/ms — a flick shorter than the threshold
  var CLAMP_LINES    = 5;

  /* Sentinel authors: real reviews that Google returned without attribution.
     They are held back until a name is filled in, at which point they render
     with no code change. Compared case-insensitively. */
  var SENTINEL_AUTHORS = ["NEEDS_NAME"];

  /**
   * Is this array entry a review we can actually show?
   * Guards against: non-objects, documentation blocks accidentally dropped into
   * the array, missing/blank authors, sentinels, and empty text.
   * @param {*} r
   * @returns {boolean}
   */
  function usableReview(r) {
    if (!r || typeof r !== "object" || Array.isArray(r)) return false;

    var author = typeof r.author === "string" ? r.author.trim() : "";
    if (!author) return false;
    if (SENTINEL_AUTHORS.indexOf(author.toUpperCase()) !== -1) return false;

    var text = typeof r.text === "string" ? r.text.trim() : "";
    if (!text) return false;

    return true;
  }

  /**
   * Initials for the avatar. Hand-added reviews may omit them, so fall back to
   * deriving them from the author name rather than rendering an empty circle.
   * @param {Object} r
   * @returns {string}
   */
  function initialsFor(r) {
    var given = typeof r.initials === "string" ? r.initials.trim() : "";
    if (given) return given.slice(0, 2).toUpperCase();

    var words = r.author.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------------------------------------------------------------------
     Icons
     --------------------------------------------------------------------- */

  var SVG_NS = "http://www.w3.org/2000/svg";

  /* Bootstrap Icons sprite (Assets/icons/kzd-icons.svg): the one icon family
     on the site. Pass "#name" wherever path data used to go. */
  function glyph(name, cls) {
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("class", "kzd-icon" + (cls ? " " + cls : ""));
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    var u = document.createElementNS(SVG_NS, "use");
    u.setAttribute("href", "/Assets/icons/kzd-icons.svg#" + name);
    s.appendChild(u);
    return s;
  }

  function svg(viewBox, paths, cls) {
    if (typeof paths === "string" && paths.charAt(0) === "#") return glyph(paths.slice(1), cls);
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", viewBox);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    if (cls) s.setAttribute("class", cls);
    paths.forEach(function (d) {
      var p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d.d);
      if (d.fill) p.style.fill = d.fill;
      s.appendChild(p);
    });
    return s;
  }


  /**
   * Five stars, filled up to `rating`.
   * @param {number} rating
   * @returns {Element}
   */
  function stars(rating) {
    var wrap = el("span", "kzd-tst__stars");
    for (var i = 1; i <= 5; i++) {
      var s = svg("0 0 24 24", "#star-fill");
      if (i > rating) s.setAttribute("class", "is-off");
      wrap.appendChild(s);
    }
    return wrap;
  }

  /** Official four-colour Google G. Not recoloured, not substituted. */
  function googleG() {
    return svg("0 0 18 18", [
      { d: "M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z", fill: "var(--kzd-mark-google-blue)" },
      { d: "M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z", fill: "var(--kzd-mark-google-green)" },
      { d: "M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 000 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z", fill: "var(--kzd-mark-google-yellow)" },
      { d: "M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4636.8918 11.4264 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z", fill: "var(--kzd-mark-google-red)" }
    ], "kzd-tst__glogo");
  }

  function chevron(dir) {
    return svg("0 0 24 24", dir === "prev" ? "#chevron-left" : "#chevron-right");
  }

  function cross() {
    return svg("0 0 24 24", "#x-lg");
  }

  /* ---------------------------------------------------------------------
     Truncation

     Real truncation, not -webkit-line-clamp: we need to know whether the text
     actually overflowed (to decide if "Read more" appears at all) and we need a
     literal ellipsis on the cut string. Binary search for the longest prefix
     that still fits inside CLAMP_LINES lines at the element's current width.
     --------------------------------------------------------------------- */

  /**
   * @param {Element} node
   * @param {string} full
   * @returns {boolean} true when the text had to be cut
   */
  function clamp(node, full) {
    // Measure one rendered line rather than parsing line-height: scrollHeight
    // is integer-rounded, so a computed 27.9px line makes a true five-line
    // block report ~140px against a 139.5px budget and get rejected — which
    // silently cut every review to four lines.
    node.textContent = "M";
    var one = node.scrollHeight;
    if (!one) return false;
    var maxH = one * CLAMP_LINES + 2;

    node.textContent = full;
    if (node.scrollHeight <= maxH) return false;

    var lo = 0, hi = full.length;
    while (lo < hi) {
      var mid = Math.ceil((lo + hi) / 2);
      node.textContent = full.slice(0, mid) + "…";
      if (node.scrollHeight <= maxH) lo = mid; else hi = mid - 1;
    }
    node.textContent = full.slice(0, lo).replace(/\s+$/, "") + "…";
    return true;
  }

  /* ---------------------------------------------------------------------
     Modal — a real dialog: focus trapped, Escape closes, focus restored.
     --------------------------------------------------------------------- */

  function Modal(section) {
    this.section = section;
    this.scrim = null;
    this.opener = null;
    this.onKey = this.onKey.bind(this);
  }

  Modal.prototype.open = function (review, tone, opener) {
    var self = this;
    this.opener = opener;

    var scrim = el("div", "kzd-tst__scrim");
    var box = el("div", "kzd-tst__modal");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    var titleId = "kzd-tst-modal-title";
    box.setAttribute("aria-labelledby", titleId);

    var close = el("button", "kzd-tst__close");
    close.type = "button";
    close.setAttribute("aria-label", "Close review");
    var closeFace = el("span", "kzd-tst__close-face");
    closeFace.appendChild(cross());
    close.appendChild(closeFace);

    var st = stars(review.rating);
    st.style.setProperty("--kzd-star", "26px");

    var quote = el("p", "kzd-tst__modal-quote", review.text);

    var author = el("div", "kzd-tst__author");
    var av = el("span", "kzd-tst__avatar", review.initials);
    av.style.setProperty("--kzd-tone", tone);
    av.setAttribute("aria-hidden", "true");
    var name = el("span", "kzd-tst__name", review.author);
    name.id = titleId;
    author.appendChild(av);
    author.appendChild(name);

    box.appendChild(close);
    box.appendChild(st);
    box.appendChild(quote);
    box.appendChild(author);
    scrim.appendChild(box);
    document.body.appendChild(scrim);

    // Lock body scroll without the content jumping as the scrollbar goes.
    var pad = window.innerWidth - document.documentElement.clientWidth;
    this.prevOverflow = document.body.style.overflow;
    this.prevPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (pad > 0) document.body.style.paddingRight = pad + "px";

    this.scrim = scrim;
    this.box = box;

    scrim.addEventListener("click", function (e) {
      if (e.target === scrim) self.close();      // backdrop only, not the card
    });
    close.addEventListener("click", function () { self.close(); });
    document.addEventListener("keydown", this.onKey);

    // Force a frame so the opening transition actually runs.
    void scrim.offsetWidth;
    scrim.classList.add("is-open");

    close.focus();
  };

  Modal.prototype.focusables = function () {
    return this.box.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
  };

  Modal.prototype.onKey = function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key !== "Tab") return;

    // Trap: cycle focus inside the dialog.
    var f = this.focusables();
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1];
    var active = document.activeElement;

    if (!this.box.contains(active)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  Modal.prototype.close = function () {
    var self = this;
    if (!this.scrim) return;
    var scrim = this.scrim;
    this.scrim = null;

    document.removeEventListener("keydown", this.onKey);
    document.body.style.overflow = this.prevOverflow;
    document.body.style.paddingRight = this.prevPad;

    function done() {
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      if (self.opener) { self.opener.focus(); self.opener = null; }
    }

    if (reduced()) { done(); return; }

    scrim.classList.remove("is-open");
    scrim.classList.add("is-closing");
    var fired = false;
    scrim.addEventListener("transitionend", function () {
      if (!fired) { fired = true; done(); }
    }, { once: true });
    window.setTimeout(function () { if (!fired) { fired = true; done(); } }, 260);
  };

  /* ---------------------------------------------------------------------
     Carousel
     --------------------------------------------------------------------- */

  function Carousel(section, data, reviews) {
    this.section = section;
    this.data = data;
    this.reviews = reviews;
    this.page = 0;
    this.cards = [];
    this.modal = new Modal(section);

    this.viewport = section.querySelector(".kzd-tst__viewport");
    this.track = section.querySelector(".kzd-tst__track");
    this.dots = section.querySelector(".kzd-tst__dots");
    this.prev = section.querySelector(".kzd-tst__arrow--prev");
    this.next = section.querySelector(".kzd-tst__arrow--next");
  }

  Carousel.prototype.perPage = function () {
    var v = getComputedStyle(this.section).getPropertyValue("--kzd-per-page");
    return Math.max(1, parseInt(v, 10) || 1);
  };

  /* Derived from the RENDERED card count (reviews that survived filtering plus
     the CTA card), never a hardcoded number — so any review count from 1 to 30+
     pages correctly with no code change. */
  Carousel.prototype.pageCount = function () {
    return Math.max(1, Math.ceil(this.cards.length / this.perPage()));
  };

  Carousel.prototype.build = function () {
    var self = this;

    this.prev.querySelector(".kzd-tst__arrow-face").appendChild(chevron("prev"));
    this.next.querySelector(".kzd-tst__arrow-face").appendChild(chevron("next"));

    this.reviews.forEach(function (r, i) {
      var tone = TONES[i % TONES.length];

      var card = el("article", "kzd-tst__card");

      var st = stars(r.rating);
      card.appendChild(st);

      var quote = el("p", "kzd-tst__quote");
      card.appendChild(quote);

      var more = el("button", "kzd-tst__more", "Read more");
      more.type = "button";
      more.setAttribute("aria-label", "Read the full review from " + r.author);
      more.addEventListener("click", function () {
        self.modal.open(r, tone, more);
      });
      card.appendChild(more);

      var author = el("div", "kzd-tst__author");
      var av = el("span", "kzd-tst__avatar", initialsFor(r));
      av.style.setProperty("--kzd-tone", tone);
      av.setAttribute("aria-hidden", "true");
      author.appendChild(av);
      author.appendChild(el("span", "kzd-tst__name", r.author));
      card.appendChild(author);

      self.track.appendChild(card);
      self.cards.push({ node: card, quote: quote, more: more, text: r.text });
    });

    // The door out, as the last card: someone paging or swiping to the end
    // arrives at it naturally.
    var cta = this.buildCta();
    this.track.appendChild(cta);
    this.cards.push({ node: cta, isCta: true });

    this.applyClamp();
    this.buildDots();
    this.bind();
    this.goTo(0, true);
  };

  /**
   * The "read them all on Google" card. Same box as a review so the row stays
   * even, but --card fill and a dashed border so it reads as a door, not a
   * testimonial. The whole card is the link.
   * @returns {Element}
   */
  Carousel.prototype.buildCta = function () {
    var total = this.data.totalReviews;
    var label = "See all " + total + " reviews";

    var a = el("a", "kzd-tst__card kzd-tst__door");
    a.href = this.data.readAllUrl || "#";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", label + " on Google, opens in a new tab");

    var g = googleG();
    g.setAttribute("class", "kzd-tst__glogo kzd-tst__door-logo");
    a.appendChild(g);

    a.appendChild(el("span", "kzd-tst__door-title", label));
    a.appendChild(el("span", "kzd-tst__door-sub", "Read every review on our Google profile."));

    var btn = el("span", "kzd-tst__door-btn");
    btn.appendChild(document.createTextNode("Open in Google"));
    btn.appendChild(svg("0 0 24 24", "#arrow-up-right", "kzd-tst__door-arrow"));
    a.appendChild(btn);

    return a;
  };

  /** Re-run truncation — card width changes with the breakpoint. */
  Carousel.prototype.applyClamp = function () {
    this.cards.forEach(function (c) {
      if (c.isCta) return;               // the CTA card has no review text
      var cut = clamp(c.quote, c.text);
      c.more.style.display = cut ? "" : "none";
    });
  };

  Carousel.prototype.buildDots = function () {
    var self = this;
    var n = this.pageCount();
    this.dots.textContent = "";
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var d = el("button", "kzd-tst__dot");
        d.type = "button";
        d.setAttribute("aria-label", "Go to page " + (idx + 1) + " of " + n);
        d.addEventListener("click", function () { self.goTo(idx); });
        self.dots.appendChild(d);
      })(i);
    }
    this.section.classList.toggle("kzd-tst--single", n <= 1);
  };

  Carousel.prototype.bind = function () {
    var self = this;

    this.prev.addEventListener("click", function () { self.goTo(self.page - 1); });
    this.next.addEventListener("click", function () { self.goTo(self.page + 1); });

    // Tabbing into a card on another page must bring that page into view rather
    // than leave focus on something off-screen.
    this.track.addEventListener("focusin", function (e) {
      for (var i = 0; i < self.cards.length; i++) {
        if (!self.cards[i].node.contains(e.target)) continue;
        var page = Math.floor(i / self.perPage());
        if (page !== self.page) self.goTo(page);
        break;
      }
    });

    // Focusing a clipped child can still scroll the overflow:hidden viewport,
    // which would desync it from the track's transform. Pin it back to 0.
    this.viewport.addEventListener("scroll", function () {
      if (self.viewport.scrollLeft !== 0) self.viewport.scrollLeft = 0;
    });

    var startX = 0, startY = 0, startT = 0, dx = 0, dragging = false, decided = false;

    function down(e) {
      if (self.pageCount() <= 1) return;
      var t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY; startT = Date.now();
      dx = 0; dragging = true; decided = false;
    }

    function move(e) {
      if (!dragging) return;
      var t = e.touches ? e.touches[0] : e;
      var mx = t.clientX - startX;
      var my = t.clientY - startY;

      if (!decided) {
        // Let vertical page scroll win unless the gesture is clearly sideways.
        if (Math.abs(my) > Math.abs(mx)) { dragging = false; return; }
        if (Math.abs(mx) < 8) return;
        decided = true;
        self.track.classList.remove("is-moving");
      }

      dx = mx;
      if (e.cancelable) e.preventDefault();   // now it is ours, stop the scroll
      self.track.style.transform =
        "translateX(" + (self.offsetFor(self.page) + dx) + "px)";
    }

    function up() {
      if (!dragging) return;
      dragging = false;
      if (!decided) return;

      var dt = Math.max(1, Date.now() - startT);
      var flick = Math.abs(dx) / dt > SWIPE_VELOCITY;

      if (Math.abs(dx) > SWIPE_DISTANCE || flick) {
        self.goTo(self.page + (dx < 0 ? 1 : -1));
      } else {
        self.goTo(self.page);
      }
      dx = 0;
    }

    this.viewport.addEventListener("touchstart", down, { passive: true });
    this.viewport.addEventListener("touchmove", move, { passive: false });
    this.viewport.addEventListener("touchend", up);
    this.viewport.addEventListener("touchcancel", up);

    var resizeTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        self.applyClamp();
        self.buildDots();
        self.page = Math.min(self.page, self.pageCount() - 1);
        self.goTo(self.page, true);
      }, 150);
    });
  };

  Carousel.prototype.offsetFor = function (page) {
    var per = this.perPage();
    var first = this.cards[page * per];
    if (!first) return 0;
    return -(first.node.offsetLeft);
  };

  /**
   * @param {number} page may be out of range — it wraps both directions
   * @param {boolean} [instant]
   */
  Carousel.prototype.goTo = function (page, instant) {
    var n = this.pageCount();
    this.page = ((page % n) + n) % n;          // loops past either end

    var animate = !instant && !reduced();
    this.track.classList.toggle("is-moving", animate);
    this.track.style.transform = "translateX(" + this.offsetFor(this.page) + "px)";

    // Cards outside the current page dim slightly mid-transition.
    var per = this.perPage();
    var from = this.page * per, to = from + per;
    this.cards.forEach(function (c, i) {
      c.node.classList.toggle("is-passing", animate && (i < from || i >= to));
    });

    if (animate) {
      var self = this;
      window.setTimeout(function () {
        self.cards.forEach(function (c) { c.node.classList.remove("is-passing"); });
      }, 420);
    }

    var current = this.page;
    Array.prototype.forEach.call(this.dots.children, function (d, i) {
      d.setAttribute("aria-current", i === current ? "true" : "false");
    });

    this.prev.setAttribute("aria-disabled", n <= 1 ? "true" : "false");
    this.next.setAttribute("aria-disabled", n <= 1 ? "true" : "false");
  };

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */

  function fillSummary(section, data) {
    section.querySelector(".kzd-tst__glogo-slot").appendChild(googleG());

    section.querySelector(".kzd-tst__score").textContent = data.rating;

    var host = section.querySelector(".kzd-tst__rating-stars");
    host.appendChild(stars(Math.round(data.rating)));

    section.querySelector(".kzd-tst__count").textContent = "(" + data.totalReviews + ")";

    var cta = section.querySelector(".kzd-tst__cta");
    if (data.reviewUrl) cta.href = data.reviewUrl;

    var sr = section.querySelector(".kzd-tst__summary-sr");
    sr.textContent = "Rated " + data.rating + " out of 5 from " +
                     data.totalReviews + " Google reviews.";
  }

  function entry(section, carousel) {
    if (reduced() || !("IntersectionObserver" in window)) return;

    section.classList.add("kzd-tst--anim");

    var head = section.querySelector(".kzd-tst__head");
    var summary = section.querySelector(".kzd-tst__summary");
    var rises = [head, summary];

    head.classList.add("kzd-tst__rise");
    summary.classList.add("kzd-tst__rise");
    summary.style.setProperty("--kzd-delay", "80ms");

    carousel.cards.forEach(function (c, i) {
      c.node.classList.add("kzd-tst__rise");
      c.node.style.setProperty("--kzd-delay", (140 + i * 70) + "ms");
      rises.push(c.node);
    });

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        obs.disconnect();                      // fires once, never replays
        rises.forEach(function (n) {
          n.classList.add("is-in");
          window.setTimeout(function () { n.classList.add("is-settled"); }, 1200);
        });
      });
    }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });

    io.observe(section);
  }

  function init() {
    var section = document.querySelector(".kzd-tst");
    if (!section) return;

    fetch(SRC, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("reviews.json " + r.status);
        return r.json();
      })
      .then(function (data) {
        // Only data.reviews is ever read, so top-level documentation keys
        // (_README, _template, …) are never candidates for rendering.
        var usable = (data.reviews || []).filter(usableReview);

        if (!usable.length) {
          section.hidden = true;
          return;
        }

        fillSummary(section, data);

        var carousel = new Carousel(section, data, usable);
        carousel.build();
        entry(section, carousel);

        section.removeAttribute("aria-busy");
      })
      .catch(function (err) {
        // Nothing to show and nothing to fake — hide rather than render chrome
        // around an empty carousel.
        section.hidden = true;
        if (window.console) console.warn("[kzd-testimonials]", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
