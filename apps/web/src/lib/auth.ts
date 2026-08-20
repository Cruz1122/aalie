import "server-only";

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

const globalForAuth = globalThis as typeof globalThis & {
  aalieAuth?: AuthInstance;
  aalieAuthPool?: Pool;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for Better Auth`);
  }
  return value;
}

function authDatabaseUrl(): string {
  const raw = requiredEnv("DATABASE_URL");
  const url = new URL(raw);
  url.searchParams.set("options", "-c search_path=auth");
  return url.toString();
}

function buildAuth() {
  const baseURL = requiredEnv("BETTER_AUTH_URL");
  const jwtIssuer = requiredEnv("AUTH_JWT_ISSUER");
  const jwtAudience = requiredEnv("AUTH_JWT_AUDIENCE");

  return betterAuth({
    database: getAuthPool(),
    baseURL,
    secret: requiredEnv("BETTER_AUTH_SECRET"),
    trustedOrigins: [baseURL],
    socialProviders: {
      google: {
        clientId: requiredEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
        prompt: "select_account",
      },
    },
    user: {
      additionalFields: {
        role: {
          type: ["USER", "ADMIN"],
          required: true,
          defaultValue: "USER",
          input: false,
          returned: true,
        },
      },
    },
    account: {
      encryptOAuthTokens: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
        strategy: "compact",
      },
    },
    advanced: {
      database: {
        joins: true,
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      storage: "memory",
      customRules: {
        "/sign-in/social": { window: 60, max: 10 },
        "/get-session": { window: 60, max: 120 },
      },
    },
    plugins: [
      jwt({
        disableSettingJwtHeader: true,
        jwks: {
          keyPairConfig: { alg: "EdDSA", crv: "Ed25519" },
        },
        jwt: {
          issuer: jwtIssuer,
          audience: jwtAudience,
          expirationTime: "5m",
          getSubject: (session) => session.user.id,
          definePayload: ({ user }) => ({ role: user.role }),
        },
      }),
      nextCookies(),
    ],
  });
}

type AuthInstance = ReturnType<typeof buildAuth>;

function getAuthPool(): Pool {
  if (!globalForAuth.aalieAuthPool) {
    const pool = new Pool({
      connectionString: authDatabaseUrl(),
      max: 10,
      connectionTimeoutMillis: 3_000,
      query_timeout: 3_000,
      statement_timeout: 3_000,
      idleTimeoutMillis: 30_000,
      application_name: "aalie-web-auth",
    });
    pool.on("error", (error) => {
      console.error("Unexpected idle PostgreSQL client error", error);
    });
    globalForAuth.aalieAuthPool = pool;
  }
  return globalForAuth.aalieAuthPool;
}

export function getAuth(): AuthInstance {
  if (!globalForAuth.aalieAuth) globalForAuth.aalieAuth = buildAuth();
  return globalForAuth.aalieAuth;
}
