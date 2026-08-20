import "server-only";

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

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
    database: new Pool({ connectionString: authDatabaseUrl() }),
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
    plugins: [
      jwt({
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
let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!authInstance) authInstance = buildAuth();
  return authInstance;
}
