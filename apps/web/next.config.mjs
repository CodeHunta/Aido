import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // No service worker in dev (avoids stale caches while building).
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone build only inside Docker (DOCKER_BUILD=1). Local dev/build
  // skips it because its copied links lock up `.next` on Windows.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  transpilePackages: ["@aido/db", "@aido/scoring", "@aido/auth", "@aido/payments", "@aido/email"],
  async redirects() {
    return [{ source: "/discover", destination: "/explore", permanent: true }];
  },
  reactStrictMode: true,
};

export default withPWA(nextConfig);
