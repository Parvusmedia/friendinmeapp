/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "friendinme.pmediaplus.com", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
    ],
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${api}/api/:path*`,
      },
      { source: "/media/:path*", destination: `${api}/media/:path*` },
    ];
  },
};

export default nextConfig;
