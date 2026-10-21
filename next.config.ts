import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Room for dashboard image uploads (they're resized in the browser first).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
