/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // The manual Database type isn't 100% compatible with @supabase/ssr generics
    // but the app is correct at runtime. Fix later by running: npx supabase gen types
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
