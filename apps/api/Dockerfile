# syntax=docker/dockerfile:1.7
FROM python:3.11-slim AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PNPM_HOME=/usr/local/share/pnpm \
    PATH=/usr/local/share/pnpm:$PATH \
    API_INTERNAL_BASE_URL=http://127.0.0.1:8000

# --- System dependencies (TeX + Node toolchain) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-latex-recommended \
    texlive-pictures \
    texlive-fonts-recommended \
  && rm -rf /var/lib/apt/lists/*

# Node.js (needed by the export worker) — install Node 22 (pnpm/tsx compatible)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get update && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

# pnpm (monorepo)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Python dependencies
WORKDIR /usr/src/app/apps/api

COPY packages/grammar/py /usr/src/app/packages/grammar/py
COPY apps/api/requirements.txt /tmp/requirements.txt

RUN python -m pip install --upgrade pip \
  && pip install -r /tmp/requirements.txt

# Node dependencies for the export worker.
# El selector `...` incluye también los workspaces dependientes del orquestador
# (`@aa/report-export-engine`, `@aa/types`) y sus dependencias externas.
WORKDIR /usr/src/app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc .editorconfig ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install -w --filter @aa/report-export-orchestrator... --frozen-lockfile


FROM base AS dev

COPY apps/api/requirements-dev.txt /tmp/requirements-dev.txt

RUN pip install -r /tmp/requirements-dev.txt

WORKDIR /usr/src/app/apps/api

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


FROM base AS prod

WORKDIR /usr/src/app/apps/api

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
