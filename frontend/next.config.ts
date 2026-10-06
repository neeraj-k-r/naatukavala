import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cap the generated widths: local photos are 1600px wide and cards/hero
    // never need more, so 2x screens stop requesting upscaled 1920–3840
    // variants (each one several hundred KB heavier than what's needed).
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          // The app never needs these in the browser (uploads use file
          // inputs, not device capture) — except geolocation, which
          // checkout uses for "Use my current location".
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;