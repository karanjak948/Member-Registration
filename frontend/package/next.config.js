/** @type {import("next").NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  images: {
    unoptimized: true,
  },

  async redirects() {
    return [
      {
        source: '/lne/loan-products/new',
        destination: '/loan-products/new',
        permanent: false,
      },
      {
        source: '/lne/loan-products',
        destination: '/loan-products',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;