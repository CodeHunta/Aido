/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone build only inside Docker (DOCKER_BUILD=1). Local dev/build
  // skips it because its copied links lock up `.next` on Windows.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  reactStrictMode: true,
};

export default nextConfig;
