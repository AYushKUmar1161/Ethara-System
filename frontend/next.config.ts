import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for minimal Docker image (copies only needed files)
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  async rewrites() {
    // In Docker/production, BACKEND_URL points to internal service name.
    // In Vercel, NEXT_PUBLIC_API_URL is the full backend URL.
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
