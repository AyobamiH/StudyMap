const { randomUUID } = require("node:crypto");

// Every production build needs a distinct service-worker script URL so a
// deploy activates a fresh cache namespace even when public/sw.js is unchanged.
const serviceWorkerVersion =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  randomUUID();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SW_VERSION: serviceWorkerVersion,
  },
};

module.exports = nextConfig;
