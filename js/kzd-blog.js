/* ==========================================================================
   KZD Solutions — BLOG

   One module for both pages. Every fetch of posts.json happens here; blog.html
   and article.html call into this and never touch the data themselves.

   --------------------------------------------------------------------------
   ⚠ SEO LIMITATION — READ THIS BEFORE TRUSTING THE META TAGS

   This is a static site whose article content is fetched client-side. That
   means the per-article <title>, meta description, canonical, Open Graph tags
   and JSON-LD are written by JavaScript AFTER first paint.

   Googlebot does render JavaScript and will usually see them. Many other
   crawlers do not: Bing is inconsistent, and the crawlers behind LinkedIn,
   Facebook, WhatsApp, Slack and X preview cards do NOT execute JavaScript at
   all. For those, every article shares whatever is in article.html's static
   <head> — so link previews will be generic and identical.

   THAT IS WHY THE ARTICLES ARE PRERENDERED. tools/build-blog.js writes one real
   file per post at /blog/<slug>.html with its metadata baked into the served
   HTML, and every internal link points there — see articlePath(). Those files
   are what crawlers and preview bots actually get.

   article.html?slug= still works and still writes its tags with JavaScript, but
   it is now a fallback for a direct hit on the old URL, not the path anything
   links to. Its canonical points at the prerendered file.

   ⚠ ALL OF THIS IS A STOPGAP. It exists only because a static site cannot render
   metadata on the server. The Next.js migration replaces it with
   generateMetadata() and the build script should be deleted at that point.
   -------------------------------------------------------------------------- */

(function (global) {
  "use strict";

  /* Root-relative on purpose. A prerendered article is served from /blog/, so a
     bare "posts.json" would resolve to /blog/posts.json and 404. */
  var SRC = "/posts.json";
  var SITE = "https://kzdsolutions.co.za";
  var WORDS_PER_MINUTE = 200;
  var SVG_NS = "http://www.w3.org/2000/svg";

  /* --------------------------------------------------------------------- */
  /* Data                                                                   */
  /* --------------------------------------------------------------------- */

  var cache = null;

  function getPosts() {
    if (cache) return Promise.resolve(cache);
    return fetch(SRC, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("posts.json " + r.status);
        return r.json();
      })
      .then(function (data) {
        var posts = (data.posts || []).filter(function (p) { return p && p.slug && p.title; });
        posts.sort(function (a, b) {
          return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
        });
        cache = posts;
        return posts;
      });
  }

  function getPost(slug) {
    return getPosts().then(function (posts) {
      return posts.filter(function (p) { return p.slug === slug; })[0] || null;
    });
  }

  /** Categories present in the data — never a hardcoded list. */
  function getCategories(posts) {
    var seen = [];
    posts.forEach(function (p) {
      if (p.category && seen.indexOf(p.category) === -1) seen.push(p.category);
    });
    return seen;
  }

  function related(posts, post, n) {
    n = n || 3;
    var same = posts.filter(function (p) {
      return p.slug !== post.slug && p.category === post.category;
    });
    if (same.length >= n) return same.slice(0, n);
    // Fall back to the most recent, still excluding the current post and
    // anything already picked.
    var picked = same.slice();
    posts.forEach(function (p) {
      if (picked.length >= n) return;
      if (p.slug === post.slug) return;
      if (picked.indexOf(p) !== -1) return;
      picked.push(p);
    });
    return picked.slice(0, n);
  }

  /* --------------------------------------------------------------------- */
  /* Helpers                                                                */
  /* --------------------------------------------------------------------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return "";
    return String(d.getDate()).padStart(2, "0") + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** Words across every block that carries text. */
  function wordCount(post) {
    var n = 0;
    (post.body || []).forEach(function (b) {
      if (!b) return;
      if (typeof b.text === "string") n += b.text.trim().split(/\s+/).filter(Boolean).length;
      if (Array.isArray(b.items)) b.items.forEach(function (i) {
        n += String(i).trim().split(/\s+/).filter(Boolean).length;
      });
    });
    return n;
  }

  /**
   * Always computed from the body. posts.json deliberately carries no
   * readingMinutes field: a stored value drifts the moment the text is edited,
   * and a confidently wrong number is worse than no number at all.
   */
  function readingMinutes(post) {
    return Math.max(1, Math.round(wordCount(post) / WORDS_PER_MINUTE));
  }


  /* --------------------------------------------------------------------- */
  /* Covers                                                                 */
  /* --------------------------------------------------------------------- */

  /* Six fixed palettes. The slug hash picks one, so a post always gets the
     same colours. */
  var PALETTES = [
    { name: "deep blue",   from: "#0B2E6B", to: "#2F72D8", ink: "#BBD4F5" },
    { name: "violet",      from: "#4A1A63", to: "#A855C9", ink: "#E3C4F0" },
    { name: "teal",        from: "#0B4F46", to: "#2E9E86", ink: "#B8E5D9" },
    { name: "amber brown", from: "#7A3E10", to: "#D9871F", ink: "#F5D8AC" },
    { name: "indigo",      from: "#252B63", to: "#5C6BC8", ink: "#C6CBEE" },
    { name: "crimson",     from: "#6B1030", to: "#C2416A", ink: "#F2C0CF" }
  ];

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** Mulberry32 — small, deterministic, seeded from the slug. */
  function prng(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * THE ONLY PLACE A COVER IS PRODUCED.
   *
   * Returns an <svg> element drawn deterministically from the post's slug, so
   * the same post always renders the same image and nothing has to be stored.
   *
   * Swapping this for a real image later — a Stable Diffusion render, a Pexels
   * photo, an uploaded file from Payload — means changing this function to
   * return an <img> instead. Nothing else in the module inspects what comes
   * back, so nothing else has to change.
   */
  function getCover(post, opts) {
    opts = opts || {};
    var seed = (post.cover && post.cover.seed) || post.slug || "";
    var h = hash(seed);
    var rand = prng(h);
    var pal = PALETTES[h % PALETTES.length];

    var W = 800, H = 500;
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Abstract cover illustration for “" + post.title + "”");
    svg.setAttribute("class", "kzd-blog__cover-svg");

    var gid = "kzdg-" + h.toString(36);
    var defs = document.createElementNS(SVG_NS, "defs");
    var grad = document.createElementNS(SVG_NS, "linearGradient");
    grad.setAttribute("id", gid);
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "1"); grad.setAttribute("y2", "1");
    [[0, pal.from], [1, pal.to]].forEach(function (stop) {
      var s = document.createElementNS(SVG_NS, "stop");
      s.setAttribute("offset", stop[0]);
      s.setAttribute("stop-color", stop[1]);
      grad.appendChild(s);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    var bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("width", W);
    bg.setAttribute("height", H);
    bg.setAttribute("fill", "url(#" + gid + ")");
    svg.appendChild(bg);

    // Large soft circles.
    var circles = 4 + Math.floor(rand() * 3);
    for (var i = 0; i < circles; i++) {
      var c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", (rand() * W).toFixed(1));
      c.setAttribute("cy", (rand() * H).toFixed(1));
      c.setAttribute("r", (110 + rand() * 190).toFixed(1));
      c.setAttribute("fill", "#FFFFFF");
      c.setAttribute("fill-opacity", (0.04 + rand() * 0.06).toFixed(3));
      svg.appendChild(c);
    }

    // Thin diagonal lines.
    var lines = 5 + Math.floor(rand() * 5);
    for (var j = 0; j < lines; j++) {
      var x1 = rand() * W, y1 = rand() * H;
      var len = 180 + rand() * 420;
      var slope = -0.35 + rand() * 0.7;
      var ln = document.createElementNS(SVG_NS, "line");
      ln.setAttribute("x1", x1.toFixed(1));
      ln.setAttribute("y1", y1.toFixed(1));
      ln.setAttribute("x2", (x1 + len).toFixed(1));
      ln.setAttribute("y2", (y1 + len * slope).toFixed(1));
      ln.setAttribute("stroke", "#FFFFFF");
      ln.setAttribute("stroke-opacity", (0.10 + rand() * 0.18).toFixed(3));
      ln.setAttribute("stroke-width", (0.8 + rand() * 1.1).toFixed(2));
      svg.appendChild(ln);
    }

    if (opts.className) svg.setAttribute("class", "kzd-blog__cover-svg " + opts.className);
    return svg;
  }

  /* --------------------------------------------------------------------- */
  /* Block rendering                                                        */
  /* --------------------------------------------------------------------- */

  /**
   * Renders one body block. Unknown types are ignored on purpose: the body is
   * data, and data from a CMS (or from a generator) must never be able to put
   * markup on the page.
   */
  function renderBlock(block) {
    if (!block || typeof block.type !== "string") return null;

    if (block.type === "paragraph") {
      return el("p", "kzd-blog__p", block.text || "");
    }

    if (block.type === "heading") {
      return el("h2", "kzd-blog__h2", block.text || "");
    }

    if (block.type === "list") {
      var ul = el("ul", "kzd-blog__list");
      (block.items || []).forEach(function (item) {
        ul.appendChild(el("li", null, String(item)));
      });
      return ul;
    }

    if (block.type === "quote") {
      return el("blockquote", "kzd-blog__quote", block.text || "");
    }

    return null;                      // unrecognised block type
  }

  function renderBody(post) {
    var frag = document.createDocumentFragment();
    (post.body || []).forEach(function (b) {
      var node = renderBlock(b);
      if (node) frag.appendChild(node);
    });
    return frag;
  }

  /* --------------------------------------------------------------------- */
  /* SEO                                                                    */
  /* --------------------------------------------------------------------- */

  function setMeta(attr, key, content) {
    var node = document.head.querySelector("meta[" + attr + '="' + key + '"]');
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attr, key);
      document.head.appendChild(node);
    }
    node.setAttribute("content", content);
    return node;
  }

  function setLink(rel, href) {
    var node = document.head.querySelector('link[rel="' + rel + '"]');
    if (!node) {
      node = document.createElement("link");
      node.setAttribute("rel", rel);
      document.head.appendChild(node);
    }
    node.setAttribute("href", href);
    return node;
  }

  function setJsonLd(id, data) {
    var node = document.getElementById(id);
    if (!node) {
      node = document.createElement("script");
      node.type = "application/ld+json";
      node.id = id;
      document.head.appendChild(node);
    }
    node.textContent = JSON.stringify(data, null, 2);
    return node;
  }

  /* The canonical path for an article is the PRERENDERED file, not the query
     form. tools/build-blog.js writes one per post so that crawlers which do not
     execute JavaScript still get real metadata; article.html?slug= keeps
     working as a fallback but points its canonical here.

     Root-relative so it resolves the same from /blog.html and from inside
     /blog/, both locally and in production.

     ⚠ STOPGAP. Phase 3 (Next.js) makes this whole mechanism unnecessary —
     generateMetadata() renders the tags server-side and there is nothing to
     pre-build. Delete this and the build script at that point. */
  function articlePath(slug) { return "/blog/" + slug + ".html"; }
  function articleUrl(post) { return SITE + articlePath(post.slug); }

  /**
   * Writes the article's metadata. See the banner at the top of this file:
   * this runs AFTER first paint, so a crawler that does not execute JavaScript
   * never sees any of it.
   */
  function applyArticleSeo(post) {
    var title = (post.seo && post.seo.metaTitle) || post.title;
    var desc = (post.seo && post.seo.metaDescription) || post.excerpt || "";
    var url = articleUrl(post);
    var img = SITE + "/images/logo-black.png";      // no per-post raster exists

    document.title = title;
    setMeta("name", "description", desc);
    if (post.seo && post.seo.keywords) setMeta("name", "keywords", post.seo.keywords.join(", "));
    setLink("canonical", url);

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "article");
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", img);
    setMeta("property", "og:site_name", "KZD Solutions");
    setMeta("property", "article:published_time", post.publishedAt);
    setMeta("property", "article:section", post.category || "");

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", img);

    setJsonLd("kzd-jsonld-article", {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: desc,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { "@type": "Organization", name: post.author || "KZD Solutions", url: SITE },
      publisher: {
        "@type": "Organization",
        name: "KZD Solutions",
        logo: { "@type": "ImageObject", url: SITE + "/images/logo-black.png" }
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      articleSection: post.category,
      wordCount: wordCount(post)
    });
  }

  function applyIndexSeo(posts) {
    setJsonLd("kzd-jsonld-blog", {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "KZD Insights",
      description: "Practical guides for South African business — real operational problems, and what actually fixes them.",
      url: SITE + "/blog.html",
      publisher: {
        "@type": "Organization",
        name: "KZD Solutions",
        logo: { "@type": "ImageObject", url: SITE + "/images/logo-black.png" }
      },
      blogPost: posts.map(function (p) {
        return {
          "@type": "BlogPosting",
          headline: p.title,
          description: p.excerpt,
          datePublished: p.publishedAt,
          url: articleUrl(p),
          author: { "@type": "Organization", name: p.author || "KZD Solutions" }
        };
      })
    });
  }

  /* --------------------------------------------------------------------- */
  /* Public surface                                                         */
  /* --------------------------------------------------------------------- */

  global.KZDBlog = {
    getPosts: getPosts,
    getPost: getPost,
    getCategories: getCategories,
    related: related,
    getCover: getCover,
    renderBlock: renderBlock,
    renderBody: renderBody,
    readingMinutes: readingMinutes,
    wordCount: wordCount,
    fmtDate: fmtDate,
    reduced: reduced,
    el: el,
    applyArticleSeo: applyArticleSeo,
    applyIndexSeo: applyIndexSeo,
    articleUrl: articleUrl,
    articlePath: articlePath,
    SITE: SITE,
    PALETTES: PALETTES
  };
})(window);
