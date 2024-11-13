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
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'javascript/auto',
      use: []
    })
    return config
  }
}

module.exports = nextConfig 