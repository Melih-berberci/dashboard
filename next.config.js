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
  // Performance optimizations
  reactStrictMode: false, // Disable double renders in dev
  swcMinify: true,
};

module.exports = nextConfig;
