import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization for S3/CloudFront URLs
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
