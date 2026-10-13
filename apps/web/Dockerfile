# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps

ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /usr/src/app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc .editorconfig ./
COPY apps/web/package.json apps/web/
COPY packages/content-catalog/package.json packages/content-catalog/
COPY packages/grammar/package.json packages/grammar/
COPY packages/types/package.json packages/types/

RUN pnpm install --filter web... --frozen-lockfile

FROM deps AS dev

ENV NODE_ENV=development
WORKDIR /usr/src/app

CMD ["pnpm", "--filter", "web", "dev", "--hostname", "0.0.0.0"]

FROM node:22-alpine AS builder

ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /usr/src/app/packages ./packages
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc .editorconfig ./
COPY apps/web/ apps/web/
COPY packages/grammar/ packages/grammar/
COPY packages/types/ packages/types/
COPY packages/content-catalog/ packages/content-catalog/
COPY packages/content-data/ packages/content-data/

WORKDIR /usr/src/app/apps/web
RUN pnpm build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/web/public ./apps/web/public

# The content catalog is loaded from the filesystem by server components and
# route handlers. Next's standalone trace keeps the package manifest but does
# not infer these dynamic JSON reads, so preserve both runtime asset trees at
# the absolute package path embedded in the traced bundle.
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/packages/content-catalog/catalog /usr/src/app/packages/content-catalog/catalog
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/packages/content-catalog/schemas /usr/src/app/packages/content-catalog/schemas
# Catalog validation resolves publicPath resources through the build-time
# repository root as well; keep the public tree available at that path while
# the copy above remains the path served by the standalone Next server.
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/web/public /usr/src/app/apps/web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
