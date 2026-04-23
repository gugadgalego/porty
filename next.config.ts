import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid picking up an unrelated lockfile higher in the filesystem (e.g. ~/package-lock.json).
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
