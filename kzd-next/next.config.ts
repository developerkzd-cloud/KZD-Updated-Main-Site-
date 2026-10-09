import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Turbopack's root is the REPO root, not this directory, because
     src/app/globals.css imports ../css/kzd-tokens.css: the one design-token
     file shared with the static site. Turbopack refuses files outside its
     root. Setting it explicitly also stops the "inferred workspace root"
     warning the repo-root package-lock.json used to cause. */
  turbopack: { root: path.resolve(import.meta.dirname, "..") },
};

export default nextConfig;
