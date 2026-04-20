import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "static1.e621.net"},
      { protocol: "https", hostname: "img2.rule34.us"},
    ],
  },
};

export default nextConfig;
