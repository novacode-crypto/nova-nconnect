import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Permite que las API Routes hagan fetch a dominios externos (Nauta)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },

  // Sin restricciones de fetch del lado del servidor
  serverExternalPackages: ['node-fetch', 'tough-cookie', 'fetch-cookie'],

  experimental: {
    // Permite cookies persistentes entre llamadas en las API routes
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig