/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ddragon.leagueoflegends.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'raw.communitydragon.org',
        pathname: '**',
      }
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
      parser: {
        parse: JSON.parse
      }
    })
    config.cache = {
      type: 'filesystem',
      // Increase the version number if you need to invalidate the cache
      version: '1.0.0'
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/data/players/:file*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300', // Cache for 5 minutes
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 