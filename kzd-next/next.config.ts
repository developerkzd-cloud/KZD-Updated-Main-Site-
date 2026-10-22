import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Turbopack's root is the REPO root, not this directory, because
     src/app/globals.css imports ../css/kzd-tokens.css: the one design-token
     file shared with the static site. Turbopack refuses files outside its
     root. Setting it explicitly also stops the "inferred workspace root"
     warning the repo-root package-lock.json used to cause. */
  turbopack: { root: path.resolve(import.meta.dirname, "..") },

  /* Performance: photos are served as AVIF (WebP as the fallback) for
     browsers that take it. */
  images: { formats: ["image/avif", "image/webp"] },

  /* The AI website builder runs as its own Node app (its Vite base and
     Express mount are both /build). Proxied rather than linked so it is
     same-origin with this site: its /build/api/* calls and assets resolve
     here, and its Publish button's relative /order hand-off lands on the
     redirect below. BUILDER_ORIGIN: local `node server/index.js` by default,
     https://my.kzdsolutions.co.za in production. */
  async rewrites() {
    const builder = process.env.BUILDER_ORIGIN || "http://localhost:3001";
    return [
      { source: "/build", destination: `${builder}/build/` },
      { source: "/build/:path*", destination: `${builder}/build/:path*` },
    ];
  },

  /* Checkout is FOSSBilling's. Query strings carry over, so the builder's
     /order?product=1&register_sld=...&next_hosting=... arrives intact. */
  async redirects() {
    const billing = process.env.NEXT_PUBLIC_FOSSBILLING_ORIGIN || "https://my.kzdsolutions.co.za";
    return [{ source: "/order", destination: `${billing}/order`, permanent: false }];
  },
};

export default nextConfig;
