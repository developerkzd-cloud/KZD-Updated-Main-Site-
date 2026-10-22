"use client";

/* The one observer behind every <Reveal>. Mounted once in the root layout:
   it watches each `[data-reveal]` element (including ones added later by
   client navigation or a remounted tab panel) and sets
   `data-revealed="true"` the first time a quarter of it is on screen. */

import { useEffect } from "react";

const PENDING = '[data-reveal]:not([data-revealed="true"])';

export default function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "true");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.25 }
    );
    const scan = (root: ParentNode) => root.querySelectorAll(PENDING).forEach((el) => io.observe(el));
    scan(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(PENDING)) io.observe(node);
          scan(node);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
