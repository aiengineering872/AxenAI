/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Fix workspace root warning
  outputFileTracingRoot: require('path').join(__dirname),
  // Disable cache headers in development to prevent 404s
  async headers() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=3600, must-revalidate',
            },
          ],
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;

