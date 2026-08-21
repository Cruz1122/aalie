import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["pg"],
  typedRoutes: true,
  transpilePackages: ["@aa/content-catalog", "@aa/grammar", "@aa/types"],

  // Configuración para Web Workers
  webpack: (config, { isServer }) => {
    if (isServer) {
      const betterAuthServerEntries = new Set([
        "better-auth",
        "better-auth/next-js",
        "better-auth/plugins",
      ]);
      config.externals.push(({ request }, callback) => {
        if (betterAuthServerEntries.has(request)) {
          return callback(null, `commonjs ${request}`);
        }
        return callback();
      });
    }

    // Solo en el cliente
    if (!isServer) {
      config.output.globalObject = "self";
    }

    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };

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
