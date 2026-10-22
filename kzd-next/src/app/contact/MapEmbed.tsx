"use client";

/* The Google map, mounted only when its card comes near the viewport. The
   embed pulls in roughly 400 KB of Google's JavaScript, so loading it with
   the page (even as a lazy iframe, which browsers fetch well ahead of the
   fold) slows the first paint for everyone, including visitors who never
   scroll to it. Until then the frame shows its grey surface. */

import { useEffect, useRef, useState } from "react";

export default function MapEmbed({ src, title, className }: { src: string; title: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {show && <iframe className={className} title={title} src={src} referrerPolicy="no-referrer-when-downgrade" />}
    </div>
  );
}
