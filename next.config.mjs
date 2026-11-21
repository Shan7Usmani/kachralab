/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pg'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self)'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      { source: '/cases', destination: '/hotspots', permanent: false },
      { source: '/simulator', destination: '/verify', permanent: false },
      { source: '/vision', destination: '/intake', permanent: false },
      { source: '/lab', destination: '/method', permanent: false },
      { source: '/human', destination: '/method', permanent: false }
    ];
  }
};

export default nextConfig;
