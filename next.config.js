/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api-inference.huggingface.co',
      },
    ],
  },

  // Server Actions are enabled by default in Next.js 14
  // No need to specify experimental.serverActions anymore

  // Production optimizations
  swcMinify: true,
  
  // Disable type checking during build (optional - remove for stricter checks)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['app', 'components', 'lib'],
    // Warning: This allows production builds to complete even if ESLint errors exist
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
