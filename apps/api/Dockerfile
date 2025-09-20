# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

# Ajustes recomendados para contenedores Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app/apps/api

# Copiamos requirements primero para aprovechar la cache de capas
COPY apps/api/requirements.txt /tmp/requirements.txt
COPY apps/api/requirements-dev.txt /tmp/requirements-dev.txt

# Instalar dependencias
RUN python -m pip install --upgrade pip && \
    pip install -r /tmp/requirements.txt && \
    pip install -r /tmp/requirements-dev.txt

# Copiar el código fuente de la API
COPY apps/api/ ./

# Exponer el puerto
EXPOSE 8000

# Comando por defecto: desarrollo con recarga automática
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
