/* ==========================================================================
   KZD Solutions — BLOG PAGE CONTROLLERS

   Renders blog.html and article.html. All content comes through js/kzd-blog.js
   (window.KZDBlog); there is no fetch in this file.
   ========================================================================== */

(function () {
  "use strict";

  var B = window.KZDBlog;
  if (!B) return;

  var el = B.el;
  var INITIAL = 7;          // featured + 6
  var STEP = 6;

  function stagger(nodes) {
    if (B.reduced()) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add("is-in"); });
      return;
    }
    Array.prototype.forEach.call(nodes, function (n, i) {
      n.style.setProperty("--kzd-b-delay", (i * 70) + "ms");
      // Two frames: the first commits the resting state, the second the change,
      // so the transition actually runs.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { n.classList.add("is-in"); });
      });
    });
  }

  function coverFrame(post, cls) {
    var frame = el("span", "kzd-blog__cover " + (cls || ""));
    frame.appendChild(B.getCover(post));
    return frame;
  }

  function meta(post) {
    var p = el("p", "kzd-blog__meta");
    var t = el("time", null, B.fmtDate(post.publishedAt));
    t.setAttribute("datetime", post.publishedAt);
    p.appendChild(t);
    p.appendChild(document.createTextNode(" · " + B.readingMinutes(post) + " min read"));
    return p;
  }

  function avatarRow(post) {
    var row = el("div", "kzd-blog__byline");
    row.appendChild(el("span", "kzd-blog__avatar", "K"));
    var t = el("div");
    t.appendChild(el("p", "kzd-blog__author", post.author || "KZD Solutions"));
    var sub = el("p", "kzd-blog__byline-sub");
    var time = el("time", null, B.fmtDate(post.publishedAt));
    time.setAttribute("datetime", post.publishedAt);
    sub.appendChild(time);
    sub.appendChild(document.createTextNode(" — " + B.readingMinutes(post) + " min read"));
    t.appendChild(sub);
    row.appendChild(t);
    return row;
  }

  /* ======================================================================
     INDEX
     ====================================================================== */

  function initIndex(root) {
    var head = root.querySelector(".kzd-blog__filters");
    var featuredHost = root.querySelector(".kzd-blog__featured-host");
    var gridHost = root.querySelector(".kzd-blog__grid");
    var moreWrap = root.querySelector(".kzd-blog__more-wrap");
    var moreBtn = root.querySelector(".kzd-blog__more");
    var live = root.querySelector(".kzd-blog__live");
    var emptyHost = root.querySelector(".kzd-blog__empty-host");

    var all = [];
    var filter = "All";
    var shown = INITIAL;

    function readUrl() {
      var q = new URLSearchParams(location.search).get("category");
      return q || "All";
    }

    function writeUrl(cat, replace) {
      var url = cat === "All" ? location.pathname : location.pathname + "?category=" + encodeURIComponent(cat);
      history[replace ? "replaceState" : "pushState"]({}, "", url);
    }

    function visible() {
      return filter === "All" ? all : all.filter(function (p) { return p.category === filter; });
    }

    function paintFilters() {
      head.textContent = "";
      var cats = ["All"].concat(B.getCategories(all));
      cats.forEach(function (c) {
        var b = el("button", "kzd-blog__pill", c);
        b.type = "button";
        b.setAttribute("aria-pressed", String(filter === c));
        b.addEventListener("click", function () {
          if (filter === c) return;
          filter = c;
          shown = INITIAL;
          writeUrl(c);
          paintFilters();
          paintPosts();
        });
        head.appendChild(b);
      });
    }

    function paintPosts() {
      featuredHost.textContent = "";
      gridHost.textContent = "";
      emptyHost.textContent = "";

      var list = visible();

      if (!list.length) {
        emptyHost.appendChild(el("p", "kzd-blog__empty",
          "No articles in " + filter + " yet"));
        moreWrap.hidden = true;
        return;
      }

      var slice = list.slice(0, shown);
      var featured = slice[0];
      var rest = slice.slice(1);

      /* featured */
      var a = el("a", "kzd-blog__featured kzd-blog__rise");
      a.href = B.articlePath(featured.slug);
      a.appendChild(coverFrame(featured, "kzd-blog__cover--featured"));
      var body = el("div", "kzd-blog__featured-body");
      body.appendChild(el("p", "kzd-blog__cat", (featured.category || "").toUpperCase()));
      body.appendChild(el("h2", "kzd-blog__featured-title", featured.title));
      body.appendChild(el("p", "kzd-blog__featured-excerpt", featured.excerpt || ""));
      body.appendChild(avatarRow(featured));
      a.appendChild(body);
      featuredHost.appendChild(a);

      /* grid */
      rest.forEach(function (post) {
        var card = el("a", "kzd-blog__card kzd-blog__rise");
        card.href = B.articlePath(post.slug);
        card.appendChild(coverFrame(post));
        card.appendChild(el("p", "kzd-blog__cat", (post.category || "").toUpperCase()));
        card.appendChild(el("h3", "kzd-blog__card-title", post.title));
        card.appendChild(el("p", "kzd-blog__card-excerpt", post.excerpt || ""));
        card.appendChild(meta(post));
        gridHost.appendChild(card);
      });

      moreWrap.hidden = shown >= list.length;
      stagger(root.querySelectorAll(".kzd-blog__rise:not(.is-in)"));
      live.textContent = "Showing " + slice.length + " of " + list.length + " articles.";
    }

    moreBtn.addEventListener("click", function () {
      shown += STEP;
      paintPosts();
    });

    window.addEventListener("popstate", function () {
      filter = readUrl();
      shown = INITIAL;
      paintFilters();
      paintPosts();
    });

    B.getPosts().then(function (posts) {
      all = posts;
      filter = readUrl();
      if (filter !== "All" && B.getCategories(all).indexOf(filter) === -1) {
        filter = "All";
        writeUrl("All", true);
      }
      B.applyIndexSeo(posts);
      paintFilters();
      paintPosts();
      root.removeAttribute("aria-busy");
    }).catch(function (err) {
      emptyHost.textContent = "";
      var box = el("div", "kzd-blog__error");
      box.appendChild(el("p", null, "Could not load the articles. " + err.message));
      var retry = el("button", "kzd-blog__more", "Retry");
      retry.type = "button";
      retry.addEventListener("click", function () { location.reload(); });
      box.appendChild(retry);
      emptyHost.appendChild(box);
      root.removeAttribute("aria-busy");
    });
  }

  /* ======================================================================
     ARTICLE
     ====================================================================== */

  function initArticle(root) {
    // A prerendered file at /blog/<slug>.html carries its slug in the page, so
    // there is no query string to read. The ?slug= form still works.
    var slug = window.__KZD_SLUG || new URLSearchParams(location.search).get("slug");
    var host = root.querySelector(".kzd-blog__article-host");
    var relatedHost = root.querySelector(".kzd-blog__related-host");

    function notFound(message) {
      host.textContent = "";
      var box = el("div", "kzd-blog__missing");
      box.appendChild(el("h1", "kzd-blog__missing-title", "Article not found"));
      box.appendChild(el("p", "kzd-blog__missing-body", message));
      var back = el("a", "kzd-blog__missing-link", "Back to all articles");
      back.href = "blog.html";
      box.appendChild(back);
      host.appendChild(box);
      document.title = "Article not found | KZD Solutions";
      root.removeAttribute("aria-busy");
    }

    if (!slug) {
      notFound("No article was specified. Pick one from the blog.");
      return;
    }

    Promise.all([B.getPost(slug), B.getPosts()]).then(function (pair) {
      var post = pair[0], posts = pair[1];

      if (!post) {
        notFound('We could not find an article with the slug "' + slug + '". It may have been moved or removed.');
        return;
      }

      B.applyArticleSeo(post);

      host.textContent = "";
      var article = el("article", "kzd-blog__article");

      article.appendChild(el("p", "kzd-blog__cat", (post.category || "").toUpperCase()));
      var h1 = el("h1", "kzd-blog__title", post.title);
      article.appendChild(h1);
      article.appendChild(el("p", "kzd-blog__excerpt", post.excerpt || ""));

      /* byline + share */
      var bylineRow = el("div", "kzd-blog__byline-row");
      var by = avatarRow(post);
      by.classList.add("kzd-blog__byline--lg");
      bylineRow.appendChild(by);

      var share = el("button", "kzd-blog__share", "Share");
      share.type = "button";
      share.addEventListener("click", function () {
        var url = location.href;
        var done = function () {
          var was = share.textContent;
          share.textContent = "Link copied";
          share.classList.add("is-done");
          setTimeout(function () {
            share.textContent = was;
            share.classList.remove("is-done");
          }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done).catch(fallback);
        } else {
          fallback();
        }
        function fallback() {
          // execCommand is deprecated but is the only route without the
          // Clipboard API, which needs a secure context.
          var ta = document.createElement("textarea");
          ta.value = url;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); done(); }
          catch (e) { share.textContent = "Press Ctrl+C"; }
          ta.remove();
        }
      });
      bylineRow.appendChild(share);
      article.appendChild(bylineRow);

      /* cover */
      var fig = el("figure", "kzd-blog__figure");
      fig.appendChild(coverFrame(post, "kzd-blog__cover--article"));
      fig.appendChild(el("figcaption", "kzd-blog__caption", "Illustration generated for this article"));
      article.appendChild(fig);

      /* body */
      var bodyWrap = el("div", "kzd-blog__body");
      bodyWrap.appendChild(B.renderBody(post));
      article.appendChild(bodyWrap);

      /* CTA */
      var cta = el("aside", "kzd-blog__cta");
      var ctaText = el("div", "kzd-blog__cta-text");
      ctaText.appendChild(el("p", "kzd-blog__cta-title", "Facing this in your business?"));
      ctaText.appendChild(el("p", "kzd-blog__cta-body",
        "We do operational consulting and build the systems that come out of it."));
      cta.appendChild(ctaText);
      var ctaBtn = el("a", "kzd-blog__cta-btn", "Book a free consultation");
      ctaBtn.href = "contact.html";
      cta.appendChild(ctaBtn);
      article.appendChild(cta);

      host.appendChild(article);

      /* related */
      var rel = B.related(posts, post, 3);
      if (rel.length) {
        relatedHost.appendChild(el("h2", "kzd-blog__related-head", "Related articles"));
        var grid = el("div", "kzd-blog__grid");
        rel.forEach(function (p) {
          var card = el("a", "kzd-blog__card kzd-blog__rise");
          card.href = B.articlePath(p.slug);
          card.appendChild(coverFrame(p));
          card.appendChild(el("p", "kzd-blog__cat", (p.category || "").toUpperCase()));
          card.appendChild(el("h3", "kzd-blog__card-title", p.title));
          card.appendChild(el("p", "kzd-blog__card-excerpt", p.excerpt || ""));
          card.appendChild(meta(p));
          grid.appendChild(card);
        });
        relatedHost.appendChild(grid);
      }

      root.removeAttribute("aria-busy");

      /* body blocks fade in on scroll */
      var blocks = bodyWrap.children;
      if (B.reduced() || !("IntersectionObserver" in window)) {
        Array.prototype.forEach.call(blocks, function (n) { n.classList.add("is-in"); });
        Array.prototype.forEach.call(relatedHost.querySelectorAll(".kzd-blog__rise"),
          function (n) { n.classList.add("is-in"); });
      } else {
        Array.prototype.forEach.call(blocks, function (n) { n.classList.add("kzd-blog__fade"); });
        var io = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-in");
            obs.unobserve(e.target);
          });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
        Array.prototype.forEach.call(blocks, function (n) { io.observe(n); });
        stagger(relatedHost.querySelectorAll(".kzd-blog__rise"));
      }
    }).catch(function (err) {
      notFound("Could not load the article. " + err.message);
    });
  }

  /* ======================================================================
     Boot
     ====================================================================== */

  function boot() {
    var index = document.querySelector(".kzd-blog--index");
    if (index) { initIndex(index); return; }
    var article = document.querySelector(".kzd-blog--article");
    if (article) initArticle(article);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
