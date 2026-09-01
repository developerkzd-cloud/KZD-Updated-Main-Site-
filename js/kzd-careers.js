/* ==========================================================================
   KZD Solutions — Careers listing

   Self-contained: no jQuery, no theme dependency. Reads careers.json at
   runtime, the same pattern as reviews.json — no key, no backend.

   ADDING A ROLE is a data edit: append to "roles" in careers.json. The counts,
   the open-before-closed ordering and the empty state are all derived here.

   Animates transform and opacity only. Every observer unobserves on first fire.
   ========================================================================== */

(function () {
  "use strict";

  var SRC = "careers.json";
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

  /**
   * A role we can actually render. Guards against documentation blocks that
   * might be dropped into the array by hand.
   * @param {*} r
   */
  function usable(r) {
    return r && typeof r === "object" && !Array.isArray(r) &&
           typeof r.title === "string" && r.title.trim() !== "" &&
           typeof r.id === "string" && r.id.trim() !== "";
  }

  function isOpen(r) {
    return String(r.status || "").toLowerCase() !== "closed";
  }

  /* --------------------------------------------------------------------- */

  function buildRow(role) {
    var open = isOpen(role);

    var li = el("li", "kzd-car__row kzd-car__rise " +
                      (open ? "kzd-car__row--open" : "kzd-car__row--closed"));
    li.style.setProperty("--kzd-k-shift", "18px");

    /* Column 1 — chips, title, meta */
    var left = el("div");

    var chips = el("div", "kzd-car__chips");
    var status = el("span", "kzd-car__chip " +
                            (open ? "kzd-car__chip--open" : "kzd-car__chip--closed"));
    status.appendChild(el("span", "kzd-car__chip-dot"));
    status.appendChild(document.createTextNode(open ? "Open" : "Closed"));
    chips.appendChild(status);

    if (role.department) {
      chips.appendChild(el("span", "kzd-car__chip kzd-car__chip--dept", role.department));
    }
    left.appendChild(chips);

    // The title opens the Job details tab. Without this the only route out of
    // the listing is "Apply now", which skips the description entirely.
    var h3 = el("h3", "kzd-car__title");
    var titleLink = el("a", "kzd-car__title-link", role.title);
    titleLink.href = "job.html?job=" + encodeURIComponent(role.id);
    h3.appendChild(titleLink);
    left.appendChild(h3);

    var meta = [role.location, role.type].filter(Boolean).join(" · ");
    if (meta) left.appendChild(el("p", "kzd-car__meta", meta));
    li.appendChild(left);

    /* Column 2 — summary */
    li.appendChild(el("p", "kzd-car__summary", role.summary || ""));

    /* Column 3 — action */
    if (open) {
      // Goes straight to the Apply tab of the job detail page; job.html reads
      // the id from the query string and the hash selects the tab.
      var a = el("a", "kzd-car__apply", "Apply now");
      a.href = "job.html?job=" + encodeURIComponent(role.id) + "#apply";
      a.setAttribute("aria-label", "Apply now for " + role.title);
      li.appendChild(a);
    } else {
      var b = el("button", "kzd-car__apply kzd-car__apply--closed", "Position filled");
      b.type = "button";
      b.disabled = true;             // genuinely disabled, so Tab skips it
      li.appendChild(b);
    }

    return li;
  }

  function emptyState() {
    var box = el("div", "kzd-car__empty kzd-car__rise");
    box.appendChild(el("p", "kzd-car__empty-title", "No open positions right now"));

    var p = el("p", "kzd-car__empty-body");
    p.appendChild(document.createTextNode(
      "We are not advertising any roles at the moment, but we do keep good applications on file. " +
      "Send us your CV at "));
    var a = el("a", null, "info@kzdsolutions.co.za");
    a.href = "mailto:info@kzdsolutions.co.za?subject=Speculative%20application";
    p.appendChild(a);
    p.appendChild(document.createTextNode(
      " and tell us what you would like to work on — we will get in touch when something opens up."));
    box.appendChild(p);
    return box;
  }

  /**
   * "3 open roles · 1 recently filled" — derived, never hardcoded.
   * @param {number} open
   * @param {number} closed
   */
  function countLine(open, closed) {
    var parts = [];
    parts.push(open + " open role" + (open === 1 ? "" : "s"));
    if (closed > 0) parts.push(closed + " recently filled");
    return parts.join(" · ");
  }

  /* --------------------------------------------------------------------- */

  function observe(section, groups) {
    if (reduced() || !("IntersectionObserver" in window)) return;

    section.classList.add("kzd-car--anim");

    groups.forEach(function (g) {
      var nodes = g.nodes;
      if (!nodes.length) return;

      Array.prototype.forEach.call(nodes, function (n, i) {
        n.classList.add("kzd-car__rise");
        n.style.setProperty("--kzd-k-delay", (i * g.stagger) + "ms");
      });

      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          obs.unobserve(e.target);
          obs.disconnect();                 // fires once, never replays
          Array.prototype.forEach.call(nodes, function (n) {
            n.classList.add("is-in");
          });
          window.setTimeout(function () {
            Array.prototype.forEach.call(nodes, function (n) {
              n.classList.add("is-settled");
            });
          }, nodes.length * g.stagger + 700);
        });
      }, { threshold: .12, rootMargin: "0px 0px -8% 0px" });

      io.observe(g.watch || nodes[0]);
    });
  }

  function init() {
    var section = document.querySelector(".kzd-car");
    if (!section) return;

    var list = section.querySelector(".kzd-car__list");
    var count = section.querySelector(".kzd-car__count");
    var jobsSection = section.querySelector(".kzd-car__jobs");

    fetch(SRC, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("careers.json " + r.status);
        return r.json();
      })
      .then(function (data) {
        var roles = (data.roles || []).filter(usable);

        // Open first, closed last; original order preserved within each group.
        var open = roles.filter(isOpen);
        var closed = roles.filter(function (r) { return !isOpen(r); });
        var ordered = open.concat(closed);

        count.textContent = countLine(open.length, closed.length);

        if (!open.length) {
          // Every role closed (or none at all): the list is replaced outright.
          list.parentNode.replaceChild(emptyState(), list);
        } else {
          ordered.forEach(function (role) { list.appendChild(buildRow(role)); });
        }

        section.removeAttribute("aria-busy");
        wire(section, jobsSection);
      })
      .catch(function (err) {
        // Nothing to show and nothing to invent: fall back to the empty state
        // so the page still reads as a careers page.
        count.textContent = "";
        list.parentNode.replaceChild(emptyState(), list);
        section.removeAttribute("aria-busy");
        wire(section, jobsSection);
        if (window.console) console.warn("[kzd-careers]", err);
      });
  }

  function wire(section, jobsSection) {
    var hero = section.querySelector(".kzd-car__hero");

    observe(section, [
      { nodes: hero.querySelectorAll(".kzd-car__eyebrow, .kzd-car__h1, .kzd-car__intro"),
        stagger: 90, watch: hero },
      { nodes: section.querySelectorAll(".kzd-car__row, .kzd-car__empty"),
        stagger: 70, watch: jobsSection },
      { nodes: section.querySelectorAll(".kzd-car__why-card"),
        stagger: 80, watch: section.querySelector(".kzd-car__why-grid") },
      { nodes: section.querySelectorAll(".kzd-car__step"),
        stagger: 80, watch: section.querySelector(".kzd-car__steps") },
      { nodes: section.querySelectorAll(".kzd-car__people-card"),
        stagger: 0, watch: section.querySelector(".kzd-car__people") }
    ]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
