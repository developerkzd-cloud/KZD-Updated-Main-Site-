import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The repo root also has a package-lock.json (it is the live static site),
     so Turbopack inferred the wrong workspace root and warned on every build.
     Pin it to this directory. */
  turbopack: { root: path.resolve(import.meta.dirname) },
};

export default nextConfig;
