/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
  // Webpack configuration if needed
  webpack: (config, { isServer }) => {
    return config;
  }
}

module.exports = nextConfig
