/* ==========================================================================
   Self-hosted faces, loaded through next/font/local.

   These are the same seven .woff2 files the static site serves from /fonts.
   Going through next/font rather than a hand-written @font-face block buys
   three things the static site never had:

     - the files are fingerprinted and served from the app's own origin
     - a size-adjusted fallback face is generated automatically, which removes
       the layout shift the static site takes on every first paint
     - preload hints are emitted for the faces a route actually uses

   Each family exposes a CSS variable so the existing token system can keep
   referring to --kzd-font-display / --kzd-font-body / --kzd-font-mono exactly
   as it does today.
   ========================================================================== */

import localFont from "next/font/local";

export const interTight = localFont({
  src: [
    { path: "../../public/fonts/inter-tight-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/inter-tight-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/inter-tight-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/inter-tight-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--kzd-font-display",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const inter = localFont({
  src: [
    { path: "../../public/fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/inter-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--kzd-font-body",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const jetbrainsMono = localFont({
  src: [
    { path: "../../public/fonts/jetbrains-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--kzd-font-mono",
  display: "swap",
  fallback: ["ui-monospace", "Cascadia Mono", "Consolas", "monospace"],
});

/** Convenience for <html className={fontVariables}>. */
export const fontVariables = [
  interTight.variable,
  inter.variable,
  jetbrainsMono.variable,
].join(" ");
