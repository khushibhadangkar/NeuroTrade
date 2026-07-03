/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiBase = process.env.NEUROTRADE_API_URL ?? "http://127.0.0.1:5001";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
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
