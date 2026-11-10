import { withPayload } from '@payloadcms/next/withPayload'
import redirects from './redirects.js'

const baseServerUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.NEXT_PUPLIC_BASE_URL ||
      process.env.NEXT_PUPLIC_APP_URL ||
      'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@react-pdf/renderer'],
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas:   false,
      encoding: false,
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      ...(baseServerUrl
        ? (() => {
            try {
              const url = new URL(baseServerUrl)
              return [{ hostname: url.hostname, protocol: url.protocol.replace(':', '') }]
            } catch {
              return []
            }
          })()
        : []),
      { hostname: 'images.unsplash.com', protocol: 'https' },
      { hostname: 'img.icons8.com',      protocol: 'https' },
      { hostname: 'cdn.flyonui.com',     protocol: 'https' },
    ],
  },
  redirects,
}

export default withPayload(nextConfig)