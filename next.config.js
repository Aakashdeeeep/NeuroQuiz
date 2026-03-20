/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Memory optimizations for development
  experimental: {
    // Reduce memory footprint by disabling unused features
    webVitalsAttribution: [],
  },

  // Hide the Next.js dev server 'N' indicator in the bottom left
  // so it doesn't interfere with the custom cursor
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },

  // Disable source maps in dev to reduce memory
  productionBrowserSourceMaps: false,

  // Keep @/* path aliases working (pointing to src/)
  // Next.js reads this from tsconfig automatically

  // Disable image optimization (saves memory, we don't use next/image)
  images: {
    unoptimized: true,
  },

  // Disable ESLint during builds (Vite codebase has different lint rules)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable telemetry to reduce background processes
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
};

module.exports = nextConfig;
