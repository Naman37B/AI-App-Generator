import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Keeps your dev server fast while coding
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// Export the config wrapped in the PWA engine
export default withPWA(nextConfig);