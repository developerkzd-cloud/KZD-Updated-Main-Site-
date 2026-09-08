/* ==========================================================================
   ⚠⚠  PROTOTYPE AUTHENTICATION — NOT REAL, NOT SECURE  ⚠⚠

   THIS MUST BE REPLACED WITH REAL SERVER-SIDE AUTHENTICATION BEFORE ANY REAL
   APPLICANT USES IT.

   What this actually is:
     - Accounts are objects in localStorage under "kzd_users".
     - PASSWORDS ARE STORED IN PLAIN TEXT. Nothing is hashed, salted or
       encrypted. Anyone with access to the browser can read every password by
       opening devtools and typing localStorage.kzd_users.
     - The "session" is a localStorage key. There is no token, no expiry and no
       server ever validates it. Editing that key signs you in as anyone.
     - Nothing is shared between devices or browsers, and everything disappears
       when browser data is cleared.
     - No email is ever sent by anything in this file.

   It exists so the careers flow is fully clickable end to end while the backend
   does not exist yet. Every place a real API call belongs is marked TODO.
   ========================================================================== */

(function (global) {
  "use strict";

  var USERS_KEY = "kzd_users";
  var SESSION_KEY = "kzd_session";

  /* --------------------------------------------------------------------- */
  /* Storage                                                                */
  /* --------------------------------------------------------------------- */

  /* Storage goes through js/kzd-store.js — it is the only module in the
     project allowed to touch localStorage. These stay synchronous because the
     auth UI is synchronous; the store exposes sync twins for exactly this. */
  function S() { return global.KZDStore || null; }

  function users() { var s = S(); return s ? s.getUsersSync() : []; }
  function session() { var s = S(); return s ? s.getSessionSync() : null; }

  function writeUsers(list) {
    var s = S();
    if (!s) return false;
    try { s.setUsersSync(list); return true; }
    catch (e) {
      if (global.console) console.warn("[kzd-auth] storage write failed", e);
      return false;
    }
  }

  function writeSession(value) {
    var s = S();
    if (!s) return false;
    try { s.setSessionSync(value); return true; } catch (e) { return false; }
  }

  /**
   * TODO(backend): replace with POST /api/auth/register. The server should hash
   * the password (argon2/bcrypt), set an httpOnly session cookie, and return the
   * user without any credential material.
   */
  function register(data) {
    if (!S()) {
      return { ok: false, message: "The account store did not load. Refresh the page (Ctrl+Shift+R) and try again." };
    }
    var list = users();
    var email = String(data.email || "").trim().toLowerCase();

    if (list.some(function (u) { return u.email === email; })) {
      return { ok: false, field: "email", message: "An account with this email already exists." };
    }

    var user = {
      firstName: String(data.firstName || "").trim(),
      lastName: String(data.lastName || "").trim(),
      email: email,
      // PLAIN TEXT. See the banner at the top of this file.
      password: String(data.password || ""),
      createdAt: new Date().toISOString()
    };

    list.push(user);
    if (!writeUsers(list)) {
      return { ok: false, message: "Could not save your account in this browser." };
    }
    writeSession({ email: user.email, firstName: user.firstName });
    return { ok: true, user: user };
  }

  /**
   * TODO(backend): replace with POST /api/auth/login. Never compare passwords
   * in the browser.
   */
  function signIn(email, password) {
    // Without the store there are no accounts to check against, and reporting
    // that as a wrong password sends people hunting for a typo that is not
    // there. Say what actually happened instead.
    if (!S()) {
      return { ok: false, message: "The account store did not load. Refresh the page (Ctrl+Shift+R) and try again." };
    }
    var e = String(email || "").trim().toLowerCase();
    var list = users();
    var user = list.filter(function (u) { return u.email === e; })[0];

    if (!user || user.password !== String(password || "")) {
      return { ok: false, message: "That email and password do not match an account." };
    }
    writeSession({ email: user.email, firstName: user.firstName });
    return { ok: true, user: user };
  }

  /** TODO(backend): replace with POST /api/auth/logout. */
  function signOut() {
    var st = S();
    if (st) st.clearSessionSync();
    paintNav();
  }

  /* --------------------------------------------------------------------- */
  /* Nav session state                                                      */
  /* --------------------------------------------------------------------- */

  /** Swaps the nav's Login/Register for the signed-in name and Sign out. */
  function paintNav() {
    var s = session();
    var lists = document.querySelectorAll(".navbar-nav");

    Array.prototype.forEach.call(lists, function (list) {
      // Clear anything we added on a previous paint.
      Array.prototype.forEach.call(list.querySelectorAll(".kzd-auth-slot"), function (n) {
        n.parentNode.removeChild(n);
      });

      var login = list.querySelector('a[href*="my.kzdsolutions.co.za/login"]');
      var reg = list.querySelector('a[href*="my.kzdsolutions.co.za/signup"]');
      var loginLi = login ? login.closest("li") : null;
      var regLi = reg ? reg.closest("li") : null;

      if (!s) {
        if (loginLi) loginLi.hidden = false;
        if (regLi) regLi.hidden = false;
        return;
      }

      if (loginLi) loginLi.hidden = true;
      if (regLi) regLi.hidden = true;

      // A page carries TWO .navbar-nav lists: the collapsing one (whose
      // Login/Register are d-lg-none, mobile only) and the desktop-right one.
      // Without mirroring that visibility class the signed-in slot appears in
      // both at once, so the name and Sign out render twice on desktop.
      var vis = loginLi && /\bd-lg-none\b/.test(loginLi.className) ? " d-lg-none" : "";

      var nameLi = document.createElement("li");
      nameLi.className = "nav-item kzd-auth-slot" + vis;
      // The name is the way in to profile.html — without this the page has no
      // entry point anywhere in the nav.
      var name = document.createElement("a");
      name.className = "nav-link kzd-auth-who";
      name.href = "profile.html";
      name.textContent = s.firstName || s.email;
      nameLi.appendChild(name);

      var outLi = document.createElement("li");
      outLi.className = "nav-item kzd-auth-slot" + vis;
      var out = document.createElement("button");
      out.type = "button";
      out.className = "nav-link kzd-auth-out";
      out.textContent = "Sign out";
      out.addEventListener("click", signOut);
      outLi.appendChild(out);

      var anchor = loginLi || list.lastElementChild;
      if (anchor && anchor.parentNode === list) {
        list.insertBefore(nameLi, anchor);
        list.insertBefore(outLi, anchor);
      } else {
        list.appendChild(nameLi);
        list.appendChild(outLi);
      }
    });
  }

  /* --------------------------------------------------------------------- */
  /* Modal                                                                  */
  /* --------------------------------------------------------------------- */

  var SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svg(viewBox, paths, cls) {
    var s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", viewBox);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    if (cls) s.setAttribute("class", cls);
    (Array.isArray(paths) ? paths : [paths]).forEach(function (d) {
      var p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }

  function eyeIcon(open) {
    return svg("0 0 24 24", open
      ? ["M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]
      : ["M2 12s3.6-6.5 10-6.5c2 0 3.7.6 5.1 1.4", "M22 12s-3.6 6.5-10 6.5c-2 0-3.7-.6-5.1-1.4", "M4 4l16 16"],
      "kzd-auth__eye-i");
  }

  var modal = {
    scrim: null,
    box: null,
    opener: null,
    mode: "signin",
    onDone: null
  };

  function field(opts) {
    var wrap = el("div", "kzd-auth__field" + (opts.half ? " kzd-auth__field--half" : ""));
    var lab = el("label", "kzd-auth__label");
    lab.setAttribute("for", opts.id);
    lab.appendChild(document.createTextNode(opts.label));
    if (opts.required) {
      var star = el("span", "kzd-auth__req", "*");
      star.setAttribute("aria-hidden", "true");
      lab.appendChild(star);
    }
    wrap.appendChild(lab);

    var holder = el("div", "kzd-auth__control");
    var input = el("input", "kzd-auth__input");
    input.id = opts.id;
    input.type = opts.type || "text";
    input.name = opts.id;
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.required) input.required = true;
    if (opts.autocomplete) input.autocomplete = opts.autocomplete;
    holder.appendChild(input);

    if (opts.type === "password") {
      var toggle = el("button", "kzd-auth__eye");
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Show password");
      toggle.appendChild(eyeIcon(true));
      toggle.addEventListener("click", function () {
        var showing = input.type === "text";
        input.type = showing ? "password" : "text";
        toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
        toggle.textContent = "";
        toggle.appendChild(eyeIcon(!showing));
      });
      holder.appendChild(toggle);
    }
    wrap.appendChild(holder);

    if (opts.hint) wrap.appendChild(el("p", "kzd-auth__hint", opts.hint));

    var err = el("p", "kzd-auth__error");
    err.id = opts.id + "-error";
    err.setAttribute("role", "alert");
    wrap.appendChild(err);

    input.setAttribute("aria-describedby", err.id);
    return { wrap: wrap, input: input, error: err };
  }

  function setError(f, message) {
    f.error.textContent = message || "";
    f.wrap.classList.toggle("has-error", !!message);
    f.input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function brandRow() {
    var row = el("div", "kzd-auth__brand");
    var img = document.createElement("img");
    img.src = "Assets/logos/kzd-mark.png";
    img.width = 96; img.height = 95;
    img.alt = "";
    img.className = "kzd-auth__mark kzd-mark is-dark";
    row.appendChild(img);
    row.appendChild(el("span", "kzd-auth__word", "KZD Solutions"));
    return row;
  }

  function buildSignIn() {
    var frag = document.createDocumentFragment();
    frag.appendChild(brandRow());

    var title = el("h2", "kzd-auth__title", "Sign in to apply");
    title.id = "kzd-auth-title";
    frag.appendChild(title);
    frag.appendChild(el("p", "kzd-auth__sub", "You need an account to submit and track your application."));

    var form = el("form", "kzd-auth__form");
    form.noValidate = true;

    var email = field({ id: "kzd-si-email", label: "Email address", type: "email", required: true, placeholder: "you@example.com", autocomplete: "email" });
    var pass = field({ id: "kzd-si-password", label: "Password", type: "password", required: true, autocomplete: "current-password" });
    form.appendChild(email.wrap);
    form.appendChild(pass.wrap);

    var forgot = el("a", "kzd-auth__forgot", "Forgot password?");
    forgot.href = "#";
    // TODO(backend): password reset needs a server to send the email.
    forgot.addEventListener("click", function (e) {
      e.preventDefault();
      setError(pass, "Password reset needs the backend — not available in this prototype.");
    });
    form.appendChild(forgot);

    var formErr = el("p", "kzd-auth__form-error");
    formErr.setAttribute("role", "alert");
    form.appendChild(formErr);

    var submit = el("button", "kzd-auth__primary", "Sign in");
    submit.type = "submit";
    form.appendChild(submit);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setError(email, ""); setError(pass, ""); formErr.textContent = "";

      var bad = false;
      if (!email.input.value.trim()) { setError(email, "Enter your email address."); bad = true; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.input.value.trim())) { setError(email, "Enter a valid email address."); bad = true; }
      if (!pass.input.value) { setError(pass, "Enter your password."); bad = true; }
      if (bad) { (email.wrap.classList.contains("has-error") ? email : pass).input.focus(); return; }

      var res = signIn(email.input.value, pass.input.value);
      if (!res.ok) { formErr.textContent = res.message; email.input.focus(); return; }
      finish(res.user);
    });

    frag.appendChild(form);

    var divider = el("div", "kzd-auth__divider");
    divider.appendChild(el("span", null, "New here?"));
    frag.appendChild(divider);

    var swap = el("button", "kzd-auth__secondary", "Create an account");
    swap.type = "button";
    swap.addEventListener("click", function () { render("register"); });
    frag.appendChild(swap);

    return { frag: frag, first: email.input };
  }

  function buildRegister() {
    var frag = document.createDocumentFragment();
    frag.appendChild(brandRow());

    var title = el("h2", "kzd-auth__title", "Create your account");
    title.id = "kzd-auth-title";
    frag.appendChild(title);
    frag.appendChild(el("p", "kzd-auth__sub", "One account lets you apply and follow where your application is."));

    var form = el("form", "kzd-auth__form");
    form.noValidate = true;

    var row = el("div", "kzd-auth__row");
    var first = field({ id: "kzd-rg-first", label: "First name", required: true, half: true, autocomplete: "given-name" });
    var last = field({ id: "kzd-rg-last", label: "Last name", required: true, half: true, autocomplete: "family-name" });
    row.appendChild(first.wrap); row.appendChild(last.wrap);
    form.appendChild(row);

    var email = field({ id: "kzd-rg-email", label: "Email address", type: "email", required: true, placeholder: "you@example.com", autocomplete: "email" });
    var pass = field({ id: "kzd-rg-password", label: "Password", type: "password", required: true, hint: "At least 8 characters", autocomplete: "new-password" });
    var conf = field({ id: "kzd-rg-confirm", label: "Confirm password", type: "password", required: true, autocomplete: "new-password" });
    form.appendChild(email.wrap); form.appendChild(pass.wrap); form.appendChild(conf.wrap);

    var consentWrap = el("div", "kzd-auth__consent");
    var cb = el("input");
    cb.type = "checkbox";
    cb.id = "kzd-rg-consent";
    cb.className = "kzd-auth__check";
    var cbLabel = el("label", "kzd-auth__consent-label");
    cbLabel.setAttribute("for", cb.id);
    cbLabel.appendChild(document.createTextNode("I accept the "));
    // TODO(content): the Privacy Notice page does not exist yet.
    var pn = el("a", null, "Privacy Notice");
    pn.href = "#";
    cbLabel.appendChild(pn);
    var star2 = el("span", "kzd-auth__req", "*");
    star2.setAttribute("aria-hidden", "true");
    cbLabel.appendChild(star2);
    consentWrap.appendChild(cb);
    consentWrap.appendChild(cbLabel);
    var consentErr = el("p", "kzd-auth__error");
    consentErr.setAttribute("role", "alert");
    form.appendChild(consentWrap);
    form.appendChild(consentErr);

    var formErr = el("p", "kzd-auth__form-error");
    formErr.setAttribute("role", "alert");
    form.appendChild(formErr);

    var submit = el("button", "kzd-auth__primary", "Create account");
    submit.type = "submit";
    form.appendChild(submit);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      [first, last, email, pass, conf].forEach(function (f) { setError(f, ""); });
      consentErr.textContent = ""; formErr.textContent = "";

      var firstBad = null;
      function fail(f, msg) { setError(f, msg); if (!firstBad) firstBad = f.input; }

      if (!first.input.value.trim()) fail(first, "Enter your first name.");
      if (!last.input.value.trim()) fail(last, "Enter your last name.");
      if (!email.input.value.trim()) fail(email, "Enter your email address.");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.input.value.trim())) fail(email, "Enter a valid email address.");
      if (pass.input.value.length < 8) fail(pass, "Use at least 8 characters.");
      if (conf.input.value !== pass.input.value) fail(conf, "Passwords do not match.");
      if (!cb.checked) {
        consentErr.textContent = "You need to accept the Privacy Notice.";
        if (!firstBad) firstBad = cb;
      }
      if (firstBad) { firstBad.focus(); return; }

      var res = register({
        firstName: first.input.value,
        lastName: last.input.value,
        email: email.input.value,
        password: pass.input.value
      });
      if (!res.ok) {
        if (res.field === "email") { setError(email, res.message); email.input.focus(); }
        else formErr.textContent = res.message;
        return;
      }
      finish(res.user);
    });

    frag.appendChild(form);

    var foot = el("p", "kzd-auth__foot");
    foot.appendChild(document.createTextNode("Already have an account? "));
    var swap = el("button", "kzd-auth__link", "Sign in");
    swap.type = "button";
    swap.addEventListener("click", function () { render("signin"); });
    foot.appendChild(swap);
    frag.appendChild(foot);

    return { frag: frag, first: first.input };
  }

  /** Swaps the contents in place — the modal never closes and reopens. */
  function render(mode) {
    modal.mode = mode;
    var built = mode === "register" ? buildRegister() : buildSignIn();

    var body = modal.box.querySelector(".kzd-auth__body");
    body.textContent = "";
    body.appendChild(built.frag);
    modal.box.setAttribute("aria-labelledby", "kzd-auth-title");
    built.first.focus();
  }

  function finish(user) {
    var cb = modal.onDone;
    close(true);
    paintNav();
    if (cb) cb(user);
  }

  function focusables() {
    return modal.box.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])'
    );
  }

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    var f = focusables();
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1], active = document.activeElement;
    if (!modal.box.contains(active)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  function reduced() {
    return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * @param {Object} opts { mode, opener, onDone }
   */
  function open(opts) {
    opts = opts || {};
    if (modal.scrim) return;

    modal.opener = opts.opener || document.activeElement;
    modal.onDone = opts.onDone || null;

    var scrim = el("div", "kzd-auth-scrim");
    var box = el("div", "kzd-auth-modal");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    var close_ = el("button", "kzd-auth__close");
    close_.type = "button";
    close_.setAttribute("aria-label", "Close");
    close_.appendChild(svg("0 0 24 24", ["M6 6l12 12", "M18 6L6 18"]));
    close_.addEventListener("click", function () { close(); });
    box.appendChild(close_);

    box.appendChild(el("div", "kzd-auth__body"));
    scrim.appendChild(box);
    document.body.appendChild(scrim);

    var pad = global.innerWidth - document.documentElement.clientWidth;
    modal.prevOverflow = document.body.style.overflow;
    modal.prevPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (pad > 0) document.body.style.paddingRight = pad + "px";

    modal.scrim = scrim;
    modal.box = box;

    scrim.addEventListener("click", function (e) { if (e.target === scrim) close(); });
    document.addEventListener("keydown", onKey);

    render(opts.mode || "signin");

    void scrim.offsetWidth;
    scrim.classList.add("is-open");
  }

  function close(silent) {
    if (!modal.scrim) return;
    var scrim = modal.scrim;
    modal.scrim = null;

    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = modal.prevOverflow;
    document.body.style.paddingRight = modal.prevPad;

    var opener = modal.opener;
    modal.opener = null;
    if (!silent) modal.onDone = null;

    function done() {
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      if (opener && opener.focus) opener.focus();
    }

    if (reduced()) { done(); return; }

    scrim.classList.remove("is-open");
    scrim.classList.add("is-closing");
    var fired = false;
    scrim.addEventListener("transitionend", function () {
      if (!fired) { fired = true; done(); }
    }, { once: true });
    global.setTimeout(function () { if (!fired) { fired = true; done(); } }, 260);
  }

  /* --------------------------------------------------------------------- */

  global.KZDAuth = {
    session: session,
    signOut: signOut,
    open: open,
    close: close,
    paintNav: paintNav,
    isSignedIn: function () { return !!session(); }
  };

  /**
   * Lets any page hand a signed-out visitor straight to the sign-in modal:
   *     somewhere.html?signin=1&next=profile.html
   * profile.html redirects here when there is no session. `next` is followed
   * only if it is a same-origin relative path, so the parameter cannot be used
   * to bounce someone to another site after they sign in.
   */
  /** Only a relative, same-origin .html path, at most one directory deep, with
   *  ".." rejected outright. Without this, ?next= could be used to bounce
   *  someone to another site immediately after they sign in. */
  function safeNext(next) {
    if (!next) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(next)) return null;      // no scheme
    if (next.indexOf("//") === 0) return null;               // no protocol-relative
    var pathPart = next.split(/[?#]/)[0];
    if (pathPart.split("/").indexOf("..") !== -1) return null;
    return /^(?:[A-Za-z0-9._-]+\/)?[A-Za-z0-9._-]+\.html(?:[?#][^\s]*)?$/.test(next) ? next : null;
  }

  function openFromQuery() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    if (params.get("signin") !== "1" || session()) return;

    var next = params.get("next") || "";
    var safe = safeNext(next);

    open({
      mode: "signin",
      onDone: function () { if (safe) location.replace(safe); }
    });
  }

  function boot() {
    paintNav();
    openFromQuery();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window);
