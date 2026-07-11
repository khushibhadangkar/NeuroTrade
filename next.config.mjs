/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      const apiBase = process.env.NEUROTRADE_API_URL ?? "http://127.0.0.1:5001";
      return [
        {
          source: "/api/backend/:path*",
          destination: `${apiBase}/:path*`,
        },
      ];
    }
    return [];
  },

  reactStrictMode: true,

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  images: {
    unoptimized: true,
  },

  // Suppress hydration warnings from browser extensions
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
