"use client";

/* ==========================================================================
   Every behaviour of the FOSSBilling kzd homepage, ported from the inline
   <script> blocks of mod_index_dashboard.html.twig. The markup stays
   server-rendered (see sections.tsx); this binds to it by the same data-kzd-*
   attributes the Twig used, so the two cannot drift apart.

   One listener set per mount, all torn down on unmount through a single
   AbortController, so client-side navigation between /hosting,
   /domains/register and /services/ai-builder never stacks handlers.
   ========================================================================== */

import { useEffect } from "react";

const TYPING_PHRASES = [
  "I want a boutique salon website named NockBeauty",
  "A coffee roastery in Durban with single-origin beans",
  "A SaaS billing platform for usage-based invoicing",
  "A law firm in Cape Town focused on labour law",
  "A seafood restaurant on the Cape Town waterfront",
];

/* The same first question the builder asks, mirrored here so obvious mash is
   caught before the page navigates. Only the cheap half: whether a real but
   short description is enough is decided in the builder itself. */
function looksLikeTyping(text: string): boolean {
  const t = (text || "").trim();
  if (!t) return true;
  const letters = t.match(/[a-z]/gi) || [];
  if (!letters.length) return true;
  const tokens = t.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (tokens.some((w) => /^(?:qwer|wert|erty|asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|1234|aaaa)/.test(w))) return true;
  const judged = tokens.filter((w) => w.length > 3);
  const wordy = judged.filter((w) => /[aeiouy]/.test(w) && !/[^aeiouy]{5,}/.test(w) && !/(.)\1\1/.test(w));
  if (judged.length && wordy.length / judged.length < 0.5) return true;
  const vowels = (t.toLowerCase().match(/[aeiouy]/g) || []).length;
  return letters.length >= 10 && vowels / letters.length < 0.2;
}

export default function KzdEffects() {
  useEffect(() => {
    const ac = new AbortController();
    const signal = ac.signal;
    const timers = new Set<number>();
    const frames = new Set<number>();
    const observers: IntersectionObserver[] = [];
    const root = document.querySelector<HTMLElement>(".kzd-home");
    if (!root) return;
    const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
    const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    };
    const frame = (fn: () => void) => {
      const id = requestAnimationFrame(() => { frames.delete(id); fn(); });
      frames.add(id);
      return id;
    };

    /* ---- Reveal on scroll (.kzd-reveal / .kzd-reveal-card) ---- */
    let replayReveal: (container: Element) => void = () => {};
    if (!("IntersectionObserver" in window) || reduceMotion) {
      $$(".kzd-reveal, .kzd-reveal-card").forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );
      observers.push(io);
      $$(".kzd-reveal, .kzd-reveal-card").forEach((el) => io.observe(el));
      replayReveal = (container) => {
        container.querySelectorAll<HTMLElement>(".kzd-reveal, .kzd-reveal-card").forEach((el) => {
          io.unobserve(el);
          el.classList.remove("is-visible");
          void el.offsetWidth;
          frame(() => el.classList.add("is-visible"));
        });
      };
    }

    /* ---- Pointer effects: spotlight, magnetic CTA, mesh parallax ---- */
    if (!reduceMotion) {
      const spotlightEls = $$(".kzd-spotlight");
      let pending: number | null = null;
      if (spotlightEls.length) {
        document.addEventListener(
          "mousemove",
          (e) => {
            if (pending) return;
            pending = frame(() => {
              pending = null;
              spotlightEls.forEach((el) => {
                const r = el.getBoundingClientRect();
                if (e.clientX < r.left - 40 || e.clientX > r.right + 40 || e.clientY < r.top - 40 || e.clientY > r.bottom + 40) return;
                el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
                el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
              });
            });
          },
          { passive: true, signal }
        );
      }

      $$(".kzd-magnetic").forEach((btn) => {
        const strength = 0.35;
        btn.addEventListener("mousemove", (e) => {
          const r = btn.getBoundingClientRect();
          btn.style.setProperty("--mag-x", (e.clientX - (r.left + r.width / 2)) * strength + "px");
          btn.style.setProperty("--mag-y", (e.clientY - (r.top + r.height / 2)) * strength + "px");
        }, { signal });
        btn.addEventListener("mouseleave", () => {
          btn.style.setProperty("--mag-x", "0px");
          btn.style.setProperty("--mag-y", "0px");
        }, { signal });
      });

      const meshZone = $(".kzd-mesh-zone");
      const meshParallax = $(".kzd-mesh-parallax");
      if (meshZone && meshParallax) {
        let meshPending: number | null = null;
        meshZone.addEventListener("mousemove", (e) => {
          if (meshPending) return;
          meshPending = frame(() => {
            meshPending = null;
            const r = meshZone.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            meshParallax.style.transform = `translate(${px * -14}px, ${py * -14}px)`;
          });
        }, { passive: true, signal });
        meshZone.addEventListener("mouseleave", () => { meshParallax.style.transform = ""; }, { signal });
      }
    }

    /* ---- FAQ cards: each toggles independently ---- */
    $$("[data-kzd-faqcard-trigger]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest("[data-kzd-faqcard]");
        const open = card?.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      }, { signal });
    });

    /* ---- Plans & pricing tabs (Domains / Business Email / Shared Hosting) ---- */
    $$("[data-kzd-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-kzd-tab");
        $$("[data-kzd-tab]").forEach((b) => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
        $$("[data-kzd-panel]").forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        const panel = $(`[data-kzd-panel="${target}"]`);
        if (panel) {
          panel.classList.add("is-active");
          replayReveal(panel);
        }
      }, { signal });
    });

    /* ---- "Show all N extensions" ---- */
    $$("[data-kzd-expand-trigger]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = $(`[data-kzd-expand-target="${btn.getAttribute("data-kzd-expand-trigger")}"]`);
        if (!target) return;
        target.hidden = false;
        btn.hidden = true;
        replayReveal(target);
      }, { signal });
    });

    /* ---- Builder demo video pause/play ---- */
    const video = $<HTMLVideoElement>(".kzd-builder-video");
    const videoToggle = $("[data-kzd-video-toggle]");
    if (video && videoToggle) {
      const pauseIcon = videoToggle.querySelector<SVGElement>("[data-kzd-icon-pause]");
      const playIcon = videoToggle.querySelector<SVGElement>("[data-kzd-icon-play]");
      const setPlaying = (playing: boolean) => {
        if (pauseIcon) pauseIcon.style.display = playing ? "" : "none";
        if (playIcon) playIcon.style.display = playing ? "none" : "";
        videoToggle.setAttribute("aria-label", playing ? "Pause video" : "Play video");
      };
      if (reduceMotion) {
        video.pause();
        video.removeAttribute("autoplay");
        setPlaying(false);
      }
      videoToggle.addEventListener("click", () => {
        if (video.paused) { void video.play(); setPlaying(true); } else { video.pause(); setPlaying(false); }
      }, { signal });
    }

    /* ---- Hero prompt: typing placeholder, chips, validation, pinned bar ---- */
    const hero = $<HTMLFormElement>("[data-kzd-prompt-form]");
    const heroInput = hero?.querySelector<HTMLInputElement>("[data-kzd-prompt-input]") ?? null;
    if (hero && heroInput) {
      const overlay = hero.querySelector<HTMLElement>("[data-kzd-prompt-typing]");
      const textEl = hero.querySelector<HTMLElement>("[data-kzd-prompt-typing-text]");
      if (overlay && textEl) {
        const TYPE_MS = 45, DELETE_MS = 25, HOLD_MS = 1500, GAP_MS = 400;
        let phraseIdx = 0, charIdx = 0, deleting = false;
        let timeoutId: number | null = null;
        const tick = () => {
          const phrase = TYPING_PHRASES[phraseIdx];
          if (!deleting) {
            charIdx += 1;
            textEl.textContent = phrase.slice(0, charIdx);
            if (charIdx >= phrase.length) { timeoutId = later(() => { deleting = true; tick(); }, HOLD_MS); return; }
            timeoutId = later(tick, TYPE_MS);
          } else {
            charIdx -= 1;
            textEl.textContent = phrase.slice(0, charIdx);
            if (charIdx <= 0) {
              deleting = false;
              phraseIdx = (phraseIdx + 1) % TYPING_PHRASES.length;
              timeoutId = later(tick, GAP_MS);
              return;
            }
            timeoutId = later(tick, DELETE_MS);
          }
        };
        /* The overlay carries an inline display:flex, which beats the [hidden]
           attribute, so it has to be toggled through style.display. */
        const stop = () => {
          if (timeoutId) { clearTimeout(timeoutId); timers.delete(timeoutId); timeoutId = null; }
          overlay.style.display = "none";
          textEl.textContent = "";
          phraseIdx = 0; charIdx = 0; deleting = false;
        };
        const start = () => {
          if (timeoutId || heroInput.value) return;
          overlay.style.display = "flex";
          if (reduceMotion) { textEl.textContent = TYPING_PHRASES[0]; return; }
          timeoutId = later(tick, 500);
        };
        heroInput.addEventListener("input", () => { if (heroInput.value) stop(); else start(); }, { signal });
        start();
      }

      const pinned = document.querySelector<HTMLFormElement>("[data-kzd-pinned-prompt]");
      const pinnedInput = pinned?.querySelector<HTMLInputElement>("[data-kzd-pinned-input]") ?? null;

      [hero, pinned].forEach((form) => {
        if (!form) return;
        const field = form.querySelector<HTMLInputElement>('input[name="prompt"]');
        if (!field) return;
        let note: HTMLParagraphElement | null = null;
        form.addEventListener("submit", (ev) => {
          if (form === pinned && !field.value.trim()) {
            ev.preventDefault();
            hero.scrollIntoView({ behavior: "smooth", block: "center" });
            later(() => heroInput.focus(), 400);
            return;
          }
          if (!looksLikeTyping(field.value)) {
            note?.remove();
            note = null;
            return;
          }
          ev.preventDefault();
          if (!note) {
            note = document.createElement("p");
            note.className = "kzd-prompt-note";
            note.setAttribute("role", "alert");
            note.style.cssText = "margin:10px 0 0;font-size:13px;font-weight:600;color:#B4431F;";
            form.insertAdjacentElement("afterend", note);
          }
          note.textContent = "That does not look like a description yet. Tell me what the business does, where it is and what it is called.";
          field.focus();
        }, { signal });
        field.addEventListener("input", () => { note?.remove(); note = null; }, { signal });
      });

      $$("[data-kzd-example-chip]").forEach((chip) => {
        chip.addEventListener("click", () => {
          heroInput.value = chip.getAttribute("data-kzd-example-chip") || "";
          heroInput.dispatchEvent(new Event("input", { bubbles: true }));
          heroInput.focus();
          if (pinnedInput) pinnedInput.value = heroInput.value;
        }, { signal });
      });

      /* Follows the visitor down the page once the hero prompt scrolls away
         (phones only, see .kzd-pinned-prompt). Moved to <body> so it sits in
         the root stacking context above every later section. */
      if (pinned && pinnedInput) {
        const home = pinned.parentNode;
        document.body.appendChild(pinned);
        const syncOffset = () => {
          const header = document.querySelector("header");
          const h = header ? Math.round(header.getBoundingClientRect().height) : 0;
          document.documentElement.style.setProperty("--kzd-pinned-top", (h > 0 ? h + 8 : 64) + "px");
        };
        syncOffset();
        window.addEventListener("resize", syncOffset, { passive: true, signal });
        const pinnedBtn = pinned.querySelector("button");
        const setPinned = (on: boolean) => {
          if (pinned.classList.contains("is-pinned") === on) return;
          pinned.classList.toggle("is-pinned", on);
          pinned.setAttribute("aria-hidden", on ? "false" : "true");
          pinnedInput.tabIndex = on ? 0 : -1;
          if (pinnedBtn) pinnedBtn.tabIndex = on ? 0 : -1;
        };
        if ("IntersectionObserver" in window) {
          const pio = new IntersectionObserver((entries) => {
            entries.forEach((e) => setPinned(!e.isIntersecting && e.boundingClientRect.top < 0));
          }, { threshold: 0 });
          pio.observe(hero);
          observers.push(pio);
        }
        heroInput.addEventListener("input", () => { pinnedInput.value = heroInput.value; }, { signal });
        pinnedInput.addEventListener("input", () => { heroInput.value = pinnedInput.value; }, { signal });
        pinnedInput.value = heroInput.value;
        signal.addEventListener("abort", () => {
          pinned.classList.remove("is-pinned");
          if (home) home.appendChild(pinned);
          else pinned.remove();
        });
      }
    }

    /* ---- Template strip: the type bar names the card at the front ---- */
    const strip = $("[data-kzd-types]");
    const stage = $(".kzd-coverflow-stage");
    if (strip && stage) {
      const pills = Array.from(strip.querySelectorAll<HTMLElement>("[data-kzd-type-pill]"));
      const cards = Array.from(stage.querySelectorAll<HTMLElement>(".kzd-cf-card"));
      const notch = strip.querySelector<HTMLElement>("[data-kzd-types-notch]");
      const track = strip.querySelector<HTMLElement>("[data-kzd-types-tabs]");
      if (pills.length && pills.length === cards.length && notch && track) {
        let current = -1;
        let raf: number | null = null;
        const markCurrent = (i: number) => {
          if (i === current) return;
          current = i;
          pills.forEach((p, n) => { if (n === i) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current"); });
          if (track.scrollWidth > track.clientWidth) {
            const p = pills[i];
            track.scrollTo({ left: p.offsetLeft - (track.clientWidth - p.offsetWidth) / 2, behavior: "smooth" });
          }
        };
        const placeNotch = (from: number, to: number, t: number) => {
          const a = pills[from], b = pills[to];
          notch.style.width = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * t + "px";
          notch.style.transform = `translateX(${a.offsetLeft + (b.offsetLeft - a.offsetLeft) * t}px)`;
        };
        const syncEdges = () => {
          const scrollable = track.scrollWidth - track.clientWidth;
          track.classList.toggle("has-start", scrollable > 1 && track.scrollLeft > 1);
          track.classList.toggle("has-end", scrollable > 1 && track.scrollLeft < scrollable - 1);
        };
        /* Read the CSS animation's own clock rather than a matching timer:
           two independent clocks drift, and a drifting bar names the wrong card. */
        const cardAnimation = () => {
          if (!cards[0].getAnimations) return null;
          const list = cards[0].getAnimations() as CSSAnimation[];
          return list.find((a) => (a.animationName || "").indexOf("kzd-cf") === 0) || list[0] || null;
        };
        const CYCLE = 19000; // must match the kzd-cf-cycle duration
        const SLOT = CYCLE / 5;
        const GONE = 2280 / SLOT;
        const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const tick = () => {
          const anim = cardAnimation();
          if (!anim || anim.playState !== "running") { raf = null; return; }
          const phase = (Number(anim.currentTime) || 0) % CYCLE;
          const slot = Math.floor(phase / SLOT) % pills.length;
          const u = (phase - slot * SLOT) / SLOT;
          const next = (slot + 1) % pills.length;
          const t = u <= GONE ? 0 : ease((u - GONE) / (1 - GONE));
          placeNotch(slot, next, t);
          markCurrent(t < 0.5 ? slot : next);
          raf = frame(tick);
        };
        const fromScroll = () => {
          const mid = stage.scrollLeft + stage.clientWidth / 2;
          let best = 0, bestD = Infinity;
          cards.forEach((c, i) => {
            const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
            if (d < bestD) { bestD = d; best = i; }
          });
          markCurrent(best);
          placeNotch(best, best, 0);
        };
        const isScroller = () => stage.scrollWidth - stage.clientWidth > 4;
        const start = () => {
          if (isScroller()) { fromScroll(); return; }
          if (raf === null) raf = frame(tick);
        };
        const stop = () => {
          if (raf !== null) { cancelAnimationFrame(raf); frames.delete(raf); raf = null; }
        };
        stage.addEventListener("scroll", () => { if (isScroller()) fromScroll(); }, { passive: true, signal });
        track.addEventListener("scroll", syncEdges, { passive: true, signal });
        if ("IntersectionObserver" in window) {
          const sio = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) start(); else stop(); });
          }, { threshold: 0 });
          sio.observe(stage);
          observers.push(sio);
        } else {
          start();
        }
        window.addEventListener("resize", () => { stop(); syncEdges(); start(); }, { passive: true, signal });
        document.fonts?.ready.then(() => { if (signal.aborted) return; syncEdges(); if (isScroller()) fromScroll(); });
        markCurrent(0);
        placeNotch(0, 0, 0);
        syncEdges();
        start();
      }
    }

    /* ---- Hosting plans: billing toggle + paired-layout swipe controls ---- */
    const plans = $("[data-kzd-plans]");
    if (plans) {
      const buttons = Array.from(plans.querySelectorAll<HTMLElement>("[data-kzd-period]"));
      const show = (period: string) => {
        buttons.forEach((b) => b.setAttribute("aria-pressed", b.getAttribute("data-kzd-period") === period ? "true" : "false"));
        const key = period.toLowerCase();
        plans.querySelectorAll("[data-kzd-price]").forEach((el) => {
          const v = el.getAttribute("data-price-" + key);
          if (v !== null) el.textContent = v;
        });
        plans.querySelectorAll("[data-kzd-billed]").forEach((el) => { el.textContent = el.getAttribute("data-billed-" + key) || ""; });
        plans.querySelectorAll("[data-kzd-per]").forEach((el) => {
          const v = el.getAttribute("data-per-" + key);
          if (v !== null) el.textContent = v;
        });
        plans.querySelectorAll("[data-kzd-period-link]").forEach((el) => {
          const v = el.getAttribute("data-href-" + key);
          if (v !== null) el.setAttribute("href", v);
        });
        const saving = plans.querySelector("[data-kzd-saving]");
        if (saving) saving.textContent = saving.getAttribute("data-saving-" + key) || "";
      };
      buttons.forEach((b) => b.addEventListener("click", () => show(b.getAttribute("data-kzd-period") || "1M"), { signal }));
      show("1M");

      const grid = plans.querySelector<HTMLElement>(".kzd-tier-grid");
      const nav = plans.querySelector<HTMLElement>("[data-kzd-tier-nav]");
      if (grid && nav) {
        const cards = Array.from(grid.querySelectorAll<HTMLElement>(".kzd-tier-card"));
        const dots = Array.from(nav.querySelectorAll<HTMLElement>(".kzd-tier-dots span"));
        const prev = nav.querySelector<HTMLButtonElement>("[data-kzd-tier-prev]");
        const next = nav.querySelector<HTMLButtonElement>("[data-kzd-tier-next]");
        const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : grid.clientWidth);
        const sync = () => {
          const max = grid.scrollWidth - grid.clientWidth;
          const gl = grid.getBoundingClientRect();
          cards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const shown = Math.min(r.right, gl.right) - Math.max(r.left, gl.left);
            dots[i]?.classList.toggle("is-on", shown > r.width * 0.6);
          });
          if (prev) prev.disabled = grid.scrollLeft <= 2;
          if (next) next.disabled = grid.scrollLeft >= max - 2;
        };
        prev?.addEventListener("click", () => grid.scrollBy({ left: -step(), behavior: "smooth" }), { signal });
        next?.addEventListener("click", () => grid.scrollBy({ left: step(), behavior: "smooth" }), { signal });
        grid.addEventListener("scroll", sync, { passive: true, signal });
        window.addEventListener("resize", sync, { passive: true, signal });
        document.fonts?.ready.then(() => { if (!signal.aborted) sync(); });
        sync();
      }
    }

    return () => {
      ac.abort();
      timers.forEach((id) => clearTimeout(id));
      frames.forEach((id) => cancelAnimationFrame(id));
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  return null;
}
