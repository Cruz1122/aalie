# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

# --- System dependencies (TeX + Node toolchain) ---
ENV DEBIAN_FRONTEND=noninteractive

# TeX Live (pdflatex) + basic tools for node installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-pictures \
    texlive-fonts-recommended \
  && rm -rf /var/lib/apt/lists/*

# Node.js (needed by the export worker) — install Node 22 (pnpm/tsx compatible)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get update && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

# Ajustes recomendados para contenedores Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# pnpm (monorepo)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app/apps/api

# Copiar aa_grammar antes de instalar (requirements.txt lo referencia)
COPY packages/grammar/py /usr/src/app/packages/grammar/py

# Copiamos requirements
COPY apps/api/requirements.txt /tmp/requirements.txt
COPY apps/api/requirements-dev.txt /tmp/requirements-dev.txt

# Instalar dependencias (incluye aa_grammar vía -e en requirements.txt)
RUN python -m pip install --upgrade pip && \
    pip install -r /tmp/requirements.txt && \
    pip install -r /tmp/requirements-dev.txt

# --- Node dependencies for the export worker ---
WORKDIR /usr/src/app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc .editorconfig ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install -w --filter @aa/report-export-orchestrator --frozen-lockfile

WORKDIR /usr/src/app/apps/api
# Copiar el código fuente de la API
COPY apps/api/ ./

# Exponer el puerto
EXPOSE 8000

# Comando por defecto: desarrollo con recarga automática
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
