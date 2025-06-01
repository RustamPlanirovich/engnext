/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Добавляем standalone режим для лучшей работы с файловой системой
  output: 'standalone',
  // Отключаем кэширование для API маршрутов
  serverRuntimeConfig: {
    // Will only be available on the server side
    PROJECT_ROOT: __dirname,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
  // Отключаем кэширование для API маршрутов
  experimental: {
    serverComponentsExternalPackages: ['fs', 'path'],
  },
  // Webpack configuration if needed
  webpack: (config, { isServer }) => {
    return config;
  }
}

module.exports = nextConfig
