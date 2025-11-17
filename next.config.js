/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'firebasestorage.googleapis.com'],
  },
  outputFileTracingRoot: require('path').join(__dirname),
};

module.exports = nextConfig;
