/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for Firebase Hosting
  images: {
    unoptimized: true, // Required for static export
    domains: ['localhost'],
  },
  // Fix workspace root warning
  outputFileTracingRoot: require('path').join(__dirname),
  // Note: headers() is not supported in static export mode
};

module.exports = nextConfig;

