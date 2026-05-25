# syntax=docker/dockerfile:1.7
FROM python:3.11-slim AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# --- System dependencies (TeX toolchain) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-latex-recommended \
    texlive-pictures \
    texlive-fonts-recommended \
    texlive-lang-english \
    texlive-lang-spanish \
  && rm -rf /var/lib/apt/lists/* \
  && mktexlsr \
  && fmtutil-sys --all 2>/dev/null || true

# Python dependencies
WORKDIR /usr/src/app/apps/api

COPY packages/grammar/py /usr/src/app/packages/grammar/py
COPY packages/content-data /usr/src/app/packages/content-data
COPY packages/content-catalog /usr/src/app/packages/content-catalog
COPY apps/api/requirements.txt /tmp/requirements.txt

RUN python -m pip install --upgrade pip \
  && pip install -r /tmp/requirements.txt

COPY apps/api /usr/src/app/apps/api


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
