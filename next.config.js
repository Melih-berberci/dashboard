/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
  // Disable backend proxy if backend is not running
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/backend/:path*',
  //       destination: 'dashboard-nine-rho-24.vercel.app/api/:path*',
  //     },
  //   ];
  // },
  
  // Performance optimizations
  reactStrictMode: false, // Disable double renders in dev
  swcMinify: true,
};

module.exports = nextConfig;
