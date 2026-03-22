import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ["@aa/grammar", "@aa/types", "@aa/exporter"],

  // Configuración para Web Workers
  webpack: (config, { isServer }) => {
    // Solo en el cliente
    if (!isServer) {
      config.output.globalObject = "self";
    }

    // Asegurar que antlr4ts se pueda usar en workers
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};
export default withNextIntl(nextConfig);
