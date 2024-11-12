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
}

module.exports = nextConfig 