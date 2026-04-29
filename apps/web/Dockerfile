# syntax=docker/dockerfile:1.7
FROM node:22-alpine

# Usar corepack para pnpm@9.15.0 (respeta packageManager del repo)
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Variables útiles
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=false

# Directorio de trabajo del monorepo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos SOLO lo necesario para resolver dependencias y aprovechar cache
# (archivos raíz del monorepo)
COPY package.json pnpm-workspace.yaml .npmrc .editorconfig ./
# Lockfile si existe (tras Issues 2/3 debería existir); si no, omite esta línea
COPY pnpm-lock.yaml ./

# Manifest del paquete web
COPY apps/web/package.json apps/web/

# Manifests de paquetes workspace usados por web
COPY packages/grammar/package.json packages/grammar/
COPY packages/types/package.json packages/types/
COPY packages/content-catalog/package.json packages/content-catalog/

# Instalar dependencias de workspaces para entorno dev en contenedor.
# Se usa --no-frozen-lockfile para evitar bloqueo si package.json cambió y
# el lockfile local aún no pudo regenerarse en el host.
RUN pnpm install --no-frozen-lockfile

# Copiar el código fuente del paquete web
COPY apps/web/ apps/web/

# Exponer puerto dev de Next
EXPOSE 3000

# Trabajar dentro del paquete web
WORKDIR /usr/src/app/apps/web

# Comando por defecto: Next en modo dev, escuchando en 0.0.0.0
CMD ["pnpm", "dev", "--port", "3000", "--hostname", "0.0.0.0"]
