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

export default nextConfig;
