/* ==========================================================================
   KZD Solutions — Client showcase (homepage)

   Self-contained: no jQuery, no theme dependency. Marquee and hover are CSS;
   this file builds the cards from CLIENTS, derives the marquee duration, drives
   the mobile carousel, and runs the modal.

   ADDING A CLIENT: append one object to CLIENTS below. Nothing else changes —
   the marquee duration, the carousel page count and the dots are all derived.

   NO LINKS ANYWHERE yet. Cards are <button>s and the modal's "View project" is
   a <button> that does nothing. Each entry has a `url` field ready: fill it in
   and follow the two TODOs to turn these into real links.
   ========================================================================== */

(function () {
  "use strict";

  /* --------------------------------------------------------------------- */
  /* DATA — the only thing that should need editing.                         */
  /* --------------------------------------------------------------------- */

  var CLIENTS = [
    {
      slug: "salonsupplyco",
      domain: "salonsupplyco.co.za",
      category: "Retail & E-commerce",
      name: "Salon Supply Co",
      description: "Online store for salon furniture and equipment, with full checkout and branches in Durban and Johannesburg",
      status: "live",
      url: ""    // TODO: add the live URL to turn this card into a link
    },
    {
      slug: "keitsleighprimary",
      domain: "keitsleighprimary.co.za",
      category: "Education",
      name: "Keitsleigh Primary School",
      description: "School website and admissions portal, with online applications and parent logins",
      status: "live",
      url: ""
    },
    {
      slug: "computergarden",
      domain: "computergarden.co.za",
      category: "Retail & Technology",
      name: "Computer Garden",
      description: "Website for a computer sales and repair business, built for speed and easy contact",
      status: "live",
      url: ""
    },
    {
      slug: "nockybeauty",
      domain: "nockybeauty.co.za",
      category: "Beauty & Wellness",
      name: "Nocky Beauty",
      description: "Salon website showcasing treatments, with online appointment booking",
      status: "live",
      url: ""
    },
    {
      slug: "farmboyfarmgirl",
      domain: "farmboyfarmgirlbrands.co.za",
      category: "Fashion",
      name: "Farmboy Farmgirl",
      description: "Online store for a clothing and leather goods brand, with full checkout",
      status: "live",
      url: ""
    },
    {
      slug: "philfabulous",
      domain: "philfabulous.co.za",
      category: "Beauty & E-commerce",
      name: "Phil-Fabulous",
      description: "Spa and beauty website with treatments, online shop and appointment booking",
      status: "soon",
      url: ""
    }
  ];

  var BASE = "Assets/clients/r/";
  var SRC_WIDTHS = [400, 800, 1200, 1760];

  /* Card 378 + 26 gap = 404px per card; the reference runs 6 cards in 45s, so
     one period of 2424px takes 45s. Holding that px/second means the duration
     is derived from the card count, never hardcoded. */
  var PX_PER_SEC = (6 * 404) / 45;   // ~53.87

  var EAGER = 2;          // first two cards load eagerly, the rest lazily
  var PAUSE_RAMP = 200;   // ms to ease the marquee to a stop, rather than cut
  var SWIPE_DISTANCE = 40;
  var SWIPE_VELOCITY = .45;

  var SVG_NS = "http://www.w3.org/2000/svg";

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svg(viewBox, d, cls) {
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", viewBox);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    if (cls) s.setAttribute("class", cls);
    (Array.isArray(d) ? d : [d]).forEach(function (p) {
      var el = document.createElementNS(SVG_NS, "path");
      el.setAttribute("d", p);
      s.appendChild(el);
    });
    return s;
  }

  function externalGlyph() { return svg("0 0 24 24", ["M8 16L16 8", "M9 8h7v7"]); }
  function chevron(dir) { return svg("0 0 24 24", dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"); }
  function cross() { return svg("0 0 24 24", ["M6 6l12 12", "M18 6L6 18"]); }

  function globe() {
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("class", "kzd-sc-modal__globe");
    [["circle", { cx: 12, cy: 12, r: 9 }],
     ["ellipse", { cx: 12, cy: 12, rx: 4, ry: 9 }]].forEach(function (spec) {
      var n = document.createElementNS(SVG_NS, spec[0]);
      for (var k in spec[1]) n.setAttribute(k, spec[1][k]);
      s.appendChild(n);
    });
    var line = document.createElementNS(SVG_NS, "path");
    line.setAttribute("d", "M3 12h18");
    s.appendChild(line);
    return s;
  }

  /** Browser lights + domain, shared by the card and the modal. */
  function chromeBar(client, cls) {
    var bar = el("div", cls);
    var lights = el("span", "kzd-sc__lights");
    ["r", "y", "g"].forEach(function (c) {
      lights.appendChild(el("span", "kzd-sc__light kzd-sc__light--" + c));
    });
    bar.appendChild(lights);
    bar.appendChild(el("span", "kzd-sc__domain", client.domain));
    return bar;
  }

  /**
   * <picture> for one client. `eager` skips lazy loading for the first cards.
   * @param {Object} c
   * @param {string} sizes
   * @param {boolean} eager
   */
  function shot(c, sizes, eager) {
    var pic = document.createElement("picture");
    var srcset = SRC_WIDTHS.map(function (w) {
      return BASE + c.slug + "-" + w + ".webp " + w + "w";
    }).join(", ");

    var source = document.createElement("source");
    source.type = "image/webp";
    source.sizes = sizes;
    source.srcset = srcset;
    pic.appendChild(source);

    var img = document.createElement("img");
    img.src = BASE + c.slug + "-800.jpg";
    img.sizes = sizes;
    img.srcset = SRC_WIDTHS.map(function (w) {
      return BASE + c.slug + "-" + w + ".jpg " + w + "w";
    }).join(", ");
    img.width = 1900;
    img.height = 927;
    img.alt = "";                       // decorative; the name carries meaning
    img.decoding = "async";
    if (!eager) img.loading = "lazy";
    pic.appendChild(img);
    return pic;
  }

  function statusBadge(c) {
    var live = c.status === "live";
    var b = el("span", "kzd-sc__status" + (live ? "" : " kzd-sc__status--soon"));
    var beacon = el("span", "kzd-sc__beacon");
    beacon.appendChild(el("span", "kzd-sc__halo"));
    beacon.appendChild(el("span", "kzd-sc__dotlive"));
    b.appendChild(beacon);
    b.appendChild(document.createTextNode(live ? "Live" : "Coming soon"));

    // Random 0-800ms so the six beacons never blink in unison — synchronised
    // blinking reads as a rendering fault rather than a live signal.
    var delay = Math.round(Math.random() * 800) + "ms";
    beacon.querySelector(".kzd-sc__halo").style.animationDelay = delay;
    beacon.querySelector(".kzd-sc__dotlive").style.animationDelay = delay;
    return b;
  }

  /* --------------------------------------------------------------------- */

  function Showcase(section) {
    this.section = section;
    this.viewport = section.querySelector(".kzd-sc__viewport");
    this.track = section.querySelector(".kzd-sc__track");
    this.dots = section.querySelector(".kzd-sc__dots");
    this.prev = section.querySelector(".kzd-sc__arrow--prev");
    this.next = section.querySelector(".kzd-sc__arrow--next");
    this.page = 0;
    this.items = [];
    this.modal = null;
    this.opener = null;
    this.rampId = 0;
    this.onKey = this.onKey.bind(this);
  }

  /**
   * @param {Object} c
   * @param {number} i index within its set
   * @param {boolean} dup set B — hidden from assistive tech and from paging
   */
  Showcase.prototype.buildCard = function (c, i, dup) {
    var self = this;
    var item = el("div", "kzd-sc__item" + (dup ? " kzd-sc__item--dup" : ""));
    if (dup) item.setAttribute("aria-hidden", "true");

    // TODO: when c.url is filled in, swap this <button> for
    // <a href={c.url} target="_blank" rel="noopener noreferrer"> and drop the
    // click handler. Nothing else in this file needs to change.
    var card = el("button", "kzd-sc__card");
    card.type = "button";
    card.setAttribute("aria-label", "Preview " + c.name + " — " + c.domain);
    if (dup) card.tabIndex = -1;

    card.appendChild(chromeBar(c, "kzd-sc__chrome"));

    var shotBox = el("div", "kzd-sc__shot");
    shotBox.appendChild(shot(c, "(max-width: 560px) 330px, 378px", i < EAGER && !dup));
    shotBox.appendChild(el("span", "kzd-sc__veil"));

    var pill = el("span", "kzd-sc__preview");
    pill.appendChild(document.createTextNode("Preview"));
    pill.appendChild(externalGlyph());
    shotBox.appendChild(pill);

    shotBox.appendChild(statusBadge(c));
    card.appendChild(shotBox);

    card.addEventListener("click", function () { self.open(c, card); });
    item.appendChild(card);

    item.appendChild(el("p", "kzd-sc__cat", c.category));
    item.appendChild(el("p", "kzd-sc__name", c.name));
    return item;
  };

  Showcase.prototype.build = function () {
    var self = this;
    var frag = document.createDocumentFragment();

    // Set A, then an identical set B. translateX(-50%) lands exactly one
    // period, so the loop has no seam.
    [false, true].forEach(function (dup) {
      CLIENTS.forEach(function (c, i) {
        var item = self.buildCard(c, i, dup);
        if (!dup) self.items.push(item);
        frag.appendChild(item);
      });
    });
    this.track.appendChild(frag);

    this.prev.querySelector(".kzd-sc__arrow-face").appendChild(chevron("prev"));
    this.next.querySelector(".kzd-sc__arrow-face").appendChild(chevron("next"));

    this.setDuration();
    this.buildDots();
    this.bind();
    this.goTo(0, true);
  };

  /** Derived from a constant px/second, so more clients = proportionally longer. */
  Showcase.prototype.setDuration = function () {
    var per = 404;                       // card 378 + gap 26
    var period = CLIENTS.length * per;   // one set == one -50% period
    this.track.style.animationDuration = (period / PX_PER_SEC).toFixed(2) + "s";
  };

  Showcase.prototype.perPage = function () {
    var v = getComputedStyle(this.section).getPropertyValue("--kzd-s-per");
    return Math.max(1, parseInt(v, 10) || 1);
  };

  Showcase.prototype.isCarousel = function () {
    return window.matchMedia("(max-width: 900px)").matches;
  };

  Showcase.prototype.pageCount = function () {
    return Math.max(1, Math.ceil(this.items.length / this.perPage()));
  };

  Showcase.prototype.buildDots = function () {
    var self = this;
    var n = this.pageCount();
    this.dots.textContent = "";
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var d = el("button", "kzd-sc__pip");
        d.type = "button";
        d.setAttribute("aria-label", "Go to page " + (idx + 1) + " of " + n);
        d.addEventListener("click", function () { self.goTo(idx); });
        self.dots.appendChild(d);
      })(i);
    }
  };

  Showcase.prototype.offsetFor = function (page) {
    var first = this.items[page * this.perPage()];
    if (!first) return 0;
    /* Measured against the TRACK, not via offsetLeft: offsetLeft is relative to
       the nearest positioned ancestor, which is .kzd-sc__rail, and the rail
       carries the gutter as padding — so offsetLeft came back 20 for the first
       card and shifted the whole row left, clipping the captions. Both rects
       share the track's transform, so the difference is transform-independent. */
    return -(first.getBoundingClientRect().left - this.track.getBoundingClientRect().left);
  };

  Showcase.prototype.goTo = function (page, instant) {
    if (!this.isCarousel()) return;
    var n = this.pageCount();
    this.page = ((page % n) + n) % n;

    this.track.style.transition = (instant || reduced())
      ? "none" : "transform 420ms cubic-bezier(.22,.61,.36,1)";
    this.track.style.transform = "translateX(" + this.offsetFor(this.page) + "px)";

    var cur = this.page;
    Array.prototype.forEach.call(this.dots.children, function (d, i) {
      d.setAttribute("aria-current", i === cur ? "true" : "false");
    });
  };

  /* --- marquee pause, eased rather than cut ------------------------------ */

  Showcase.prototype.ramp = function (to) {
    var self = this;
    if (this.isCarousel() || reduced()) return;

    var anims = this.track.getAnimations ? this.track.getAnimations() : [];
    if (!anims.length) return;
    var a = anims[0];

    var from = a.playbackRate;
    if (from === to) return;
    var start = null;
    var id = ++this.rampId;

    function step(now) {
      if (id !== self.rampId) return;      // a newer ramp took over
      if (start === null) start = now;
      var t = Math.min((now - start) / PAUSE_RAMP, 1);
      a.playbackRate = from + (to - from) * t;
      if (t < 1) window.requestAnimationFrame(step);
      else self.section.classList.toggle("is-held", to === 0);
    }
    window.requestAnimationFrame(step);
  };

  Showcase.prototype.bind = function () {
    var self = this;

    // Hovering anywhere on the row pauses the WHOLE track — a moving card is
    // impossible to read, and the pause is what makes the preview usable.
    this.section.addEventListener("mouseenter", function () { self.ramp(0); });
    this.section.addEventListener("mouseleave", function () { self.ramp(1); });
    this.section.addEventListener("focusin", function () { self.ramp(0); });

    this.prev.addEventListener("click", function () { self.goTo(self.page - 1); });
    this.next.addEventListener("click", function () { self.goTo(self.page + 1); });

    var startX = 0, startY = 0, startT = 0, dx = 0, dragging = false, decided = false;

    function down(e) {
      if (!self.isCarousel() || self.pageCount() <= 1) return;
      var t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY; startT = Date.now();
      dx = 0; dragging = true; decided = false;
    }
    function move(e) {
      if (!dragging) return;
      var t = e.touches ? e.touches[0] : e;
      var mx = t.clientX - startX, my = t.clientY - startY;
      if (!decided) {
        if (Math.abs(my) > Math.abs(mx)) { dragging = false; return; }
        if (Math.abs(mx) < 8) return;
        decided = true;
        self.track.style.transition = "none";
      }
      dx = mx;
      if (e.cancelable) e.preventDefault();
      self.track.style.transform =
        "translateX(" + (self.offsetFor(self.page) + dx) + "px)";
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      if (!decided) return;
      var flick = Math.abs(dx) / Math.max(1, Date.now() - startT) > SWIPE_VELOCITY;
      if (Math.abs(dx) > SWIPE_DISTANCE || flick) self.goTo(self.page + (dx < 0 ? 1 : -1));
      else self.goTo(self.page);
      dx = 0;
    }

    this.viewport.addEventListener("touchstart", down, { passive: true });
    this.viewport.addEventListener("touchmove", move, { passive: false });
    this.viewport.addEventListener("touchend", up);
    this.viewport.addEventListener("touchcancel", up);

    var timer;
    window.addEventListener("resize", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        self.buildDots();
        self.page = Math.min(self.page, self.pageCount() - 1);
        if (self.isCarousel()) self.goTo(self.page, true);
        else self.track.style.transform = "";     // hand it back to the keyframes
      }, 150);
    }, { passive: true });
  };

  /* --- modal ------------------------------------------------------------- */

  Showcase.prototype.open = function (c, opener) {
    var self = this;
    this.opener = opener;
    this.ramp(0);                       // marquee holds while the modal is up

    var scrim = el("div", "kzd-sc-scrim");
    var box = el("div", "kzd-sc-modal");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    var titleId = "kzd-sc-modal-title";
    box.setAttribute("aria-labelledby", titleId);

    var chrome = chromeBar(c, "kzd-sc-modal__chrome");
    chrome.appendChild(globe());

    var close = el("button", "kzd-sc-modal__close");
    close.type = "button";
    close.setAttribute("aria-label", "Close preview");
    close.appendChild(cross());
    chrome.appendChild(close);
    box.appendChild(chrome);

    var shotBox = el("div", "kzd-sc-modal__shot");
    shotBox.appendChild(shot(c, "(max-width: 560px) 100vw, 880px", true));
    box.appendChild(shotBox);

    var foot = el("div", "kzd-sc-modal__foot");
    foot.appendChild(el("p", "kzd-sc-modal__cat", c.category));
    var name = el("p", "kzd-sc-modal__name", c.name);
    name.id = titleId;
    foot.appendChild(name);
    foot.appendChild(el("p", "kzd-sc-modal__desc", c.description));

    // TODO: when c.url is filled in, swap this <button> for
    // <a href={c.url} target="_blank" rel="noopener noreferrer">.
    var go = el("button", "kzd-sc-modal__go");
    go.type = "button";
    go.appendChild(document.createTextNode("View project"));
    go.appendChild(externalGlyph());
    foot.appendChild(go);

    box.appendChild(foot);
    scrim.appendChild(box);
    document.body.appendChild(scrim);

    var pad = window.innerWidth - document.documentElement.clientWidth;
    this.prevOverflow = document.body.style.overflow;
    this.prevPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (pad > 0) document.body.style.paddingRight = pad + "px";

    this.scrim = scrim;
    this.box = box;

    scrim.addEventListener("click", function (e) {
      if (e.target === scrim) self.close();
    });
    close.addEventListener("click", function () { self.close(); });
    document.addEventListener("keydown", this.onKey);

    void scrim.offsetWidth;
    scrim.classList.add("is-open");
    close.focus();
  };

  Showcase.prototype.focusables = function () {
    return this.box.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
  };

  Showcase.prototype.onKey = function (e) {
    if (e.key === "Escape") { e.preventDefault(); this.close(); return; }
    if (e.key !== "Tab") return;

    var f = this.focusables();
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1], active = document.activeElement;

    if (!this.box.contains(active)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  Showcase.prototype.close = function () {
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
      self.ramp(1);                     // marquee resumes
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

  /* --------------------------------------------------------------------- */

  function init() {
    var section = document.querySelector(".kzd-sc");
    if (!section) return;

    var sc = new Showcase(section);
    sc.build();

    if (reduced() || !("IntersectionObserver" in window)) {
      section.classList.add("is-rolling");   // CSS turns the animation off anyway
      return;
    }

    section.classList.add("kzd-sc--anim");

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        obs.disconnect();                    // fires once, never replays
        section.classList.add("is-in");

        // The marquee starts AFTER the fade, not during it.
        window.setTimeout(function () {
          section.classList.add("is-rolling");
          section.querySelector(".kzd-sc__head").classList.add("is-settled");
          section.querySelector(".kzd-sc__rail").classList.add("is-settled");
        }, 820);
      });
    }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });

    io.observe(section);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
