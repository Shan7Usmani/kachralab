/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
