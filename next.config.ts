import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  // Biarkan route API dan nav runtime tidak dicache, aktifkan pembaruan service worker instan
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    navigateFallbackDenylist: [/^\/api\//],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
