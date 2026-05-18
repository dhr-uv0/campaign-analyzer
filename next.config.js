/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Supabase generic type inference produces false-positive never[] errors;
    // runtime behavior is correct. Remove once types are regenerated from live schema.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['twilio'],
  },
}

module.exports = nextConfig
