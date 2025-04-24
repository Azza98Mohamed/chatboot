/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify est maintenant activé par défaut dans Next.js 15+
  // Supprimez cette ligne
  eslint: {
    ignoreDuringBuilds: true, // Optionnel : ignore les erreurs ESLint pendant le build
  }
}

export default nextConfig