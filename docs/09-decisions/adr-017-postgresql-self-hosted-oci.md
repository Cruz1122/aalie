# ADR-017: PostgreSQL self-hosted en OCI

**Estado:** aceptado  
**Fecha:** 2026-08-19  
**Ámbito:** AALIE Fase 4 / Microfase 1

## Decisión

Ejecutar PostgreSQL 18.4 en la misma VM OCI de AALIE, mediante el servicio privado `postgres` de `infra/oci/compose.yml`, usando la imagen oficial `postgres:18.4-bookworm@sha256:1961f96e6029a02c3812d7cb329a3b03a3ac2bb067058dec17b0f5596aca9296`. El volumen se monta en `/var/lib/postgresql`, no en la ruta histórica. La base no publica `5432` al host.

La API recibe `postgresql+psycopg://` y Next recibe una URL estándar `postgresql://`. En OCI, `.env` conserva únicamente `AALIE_TAG`; las credenciales y URLs viven en `.env.runtime` con modo `0600`. El deploy ejecuta `alembic upgrade head` antes de levantar API/web y un rollback solo revierte imágenes: nunca hace downgrade del esquema.

## Motivos

- Volumen y tráfico esperados bajos: una instancia self-hosted evita coste adicional y mantiene la topología simple.
- La próxima fase necesita persistencia relacional, migraciones y una base disponible para evolución de modelos.
- La imagen oficial fijada por tag y digest es reproducible y multi-arquitectura (amd64/ARM64).
- La red Compose privada reduce superficie de exposición; solo Caddy publica 80/443.

## Consecuencias y límites

El volumen `postgres-data` sobrevive a `docker compose down`; `down -v` es destructivo y queda reservado a pruebas con un proyecto/volumen aislado. Los backups `pg_dump -Fc` se guardan inicialmente en el mismo disco de la VM: no son recuperación ante pérdida del host y no se automatiza Object Storage en esta microfase.

La migración Alembic de autenticación crea únicamente el schema `auth` y las tablas de Better Auth/JWKS; no se crean tablas de negocio ni rate limiting. Las migraciones futuras deben ser compatibles con la imagen anterior para que el rollback de imágenes sea seguro.

## Alternativas descartadas

- Servicio PostgreSQL gestionado: mayor coste y complejidad para el volumen esperado.
- Publicar `5432`: innecesario y contrario al perímetro privado de OCI.
- `Base.metadata.create_all()`: no ofrece historial reproducible ni control de despliegue.
