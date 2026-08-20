# ADR-018: Google OAuth con Better Auth y frontera JWT hacia FastAPI

**Estado:** aceptado  
**Fecha:** 2026-08-20  
**Ámbito:** AALIE Fase 4 / Microfase 2

## Contexto

AALIE debe conservar el uso anónimo de sus funcionalidades pedagógicas, pero necesita identidad persistente para futuras cuotas diferenciadas, progreso server-side y participación experimental explícita.

La aplicación ya dispone de un BFF Next.js, FastAPI y PostgreSQL privado en OCI. La solución de identidad debe integrarse sin introducir contraseñas locales, sin exponer secretos al navegador y sin convertir la condición de un estudio académico en un rol de autorización.

## Decisión

### Proveedor y runtime de autenticación

Usar **Better Auth 1.7.1** en `apps/web` y **Google OAuth** como único mecanismo de inicio de sesión de usuario en esta microfase.

No implementar:

- email/password local;
- magic links;
- GitHub OAuth;
- roles adicionales como `TEACHER` o `RESEARCHER`.

La configuración Better Auth es `server-only` y recibe secrets únicamente desde variables de entorno del contenedor web.

### Base de datos

Better Auth usa PostgreSQL mediante `pg.Pool` y una conexión con `search_path=auth`.

Separación de schemas:

- `auth`: identidad, sesiones, cuentas OAuth y JWKS;
- `public`: dominio AALIE y futuras tablas académicas.

**Alembic es el único mecanismo de migración de producción.** El schema esperado por Better Auth se versiona explícitamente mediante las migraciones de `apps/api/migrations/versions/`; no se ejecutan migraciones ocultas durante requests ni `create_all()`.

### Roles operativos

Los únicos roles de producto son:

```text
USER | ADMIN
```

Reglas:

- todo usuario nuevo recibe `USER`;
- `role` es server-owned (`input:false`);
- el cliente no puede autoasignarse `ADMIN`;
- no se usa una lista permanente de emails privilegiados;
- la promoción inicial a ADMIN es una operación explícita del operador mediante el mecanismo documentado en OCI.

No se adopta el plugin admin de Better Auth porque AALIE necesita un contrato mínimo y exacto de dos roles, no una superficie genérica de administración de usuarios.

### Sesiones y credenciales OAuth

- sesiones persistentes: 7 días;
- renovación (`updateAge`): 24 horas;
- sin `cookieCache` en la configuración actual;
- `account.encryptOAuthTokens: true` para credenciales OAuth persistidas.

La decisión de no usar cookie cache prioriza revocación/cambios de rol coherentes sobre una optimización innecesaria para la escala esperada.

### JWT de servicio

El navegador mantiene la sesión opaca de Better Auth. Para la frontera hacia FastAPI se usa el plugin JWT:

- firma: `EdDSA` con `Ed25519`;
- expiración: 5 minutos;
- `issuer` y `audience` explícitos por entorno;
- `subject = user.id`;
- claim adicional mínimo: `role`.

No se incluyen email ni nombre en el JWT porque FastAPI no los necesita para autorización.

`/api/auth/token` comprueba una sesión autoritativa antes de permitir minting del token.

### Validación en FastAPI

FastAPI valida:

- estructura/tamaño del bearer token;
- algoritmo EdDSA;
- `kid`;
- JWKS Ed25519;
- firma;
- `iss`;
- `aud`;
- `exp`;
- `sub`;
- `role ∈ {USER, ADMIN}`.

El JWKS se consume por la red interna mediante `AUTH_JWKS_URL=http://web:3000/api/auth/jwks` y se cachea con TTL, stale fallback limitado y control de refresh ante `kid` desconocido.

El JWKS **no** se incorpora a `/health/ready` para evitar una dependencia de arranque `web → api → web`.

### Acceso anónimo

La autenticación es opcional. Esta microfase no protege globalmente las rutas pedagógicas existentes. Analysis, trace, export, contenido y quizzes continúan disponibles para usuarios anónimos.

Los endpoints de prueba de frontera son:

- `/auth/whoami` para cualquier usuario autenticado;
- `/auth/admin/ping` para ADMIN.

La política de rate limiting por feature y la identidad estable del visitante anónimo se implementarán por separado.

### Separación de investigación

La condición experimental futura:

```text
AALIE | CONTROL
```

no es un rol y no se almacena en `user.role`.

La identidad de producto y la identidad académica deben separarse:

```text
user_id operativo → participant_id seudónimo → condición de estudio
```

Iniciar sesión no inscribe al usuario automáticamente en un estudio y no constituye consentimiento de investigación.

## Motivos

- Aprovecha el runtime Next.js ya desplegado y evita incorporar otro servicio de identidad.
- Google OAuth elimina almacenamiento y recuperación de contraseñas propias.
- Better Auth proporciona sesiones persistentes y JWKS sin acoplar FastAPI al cookie format del frontend.
- JWT de vida corta y payload mínimo reduce exposición entre servicios.
- Roles exactos simplifican autorización y evitan mezclar permisos operativos con metodología experimental.
- Mantener uso anónimo conserva el comportamiento pedagógico existente y permite introducir cuotas en una microfase independiente.

## Consecuencias

### Positivas

- identidad persistente sin contraseñas locales;
- sesiones almacenadas en PostgreSQL;
- secretos Google permanecen server-side;
- FastAPI puede autorizar sin consultar PostgreSQL por cada request;
- rotación de claves compatible con JWKS;
- frontera USER/ADMIN testeable de forma determinista;
- no se bloquea el uso anónimo actual.

### Costes y límites

- el login real depende de disponibilidad/configuración de Google;
- el runtime web pasa a depender de PostgreSQL para Better Auth;
- la rotación de `BETTER_AUTH_SECRET` debe considerar datos cifrados existentes;
- JWT emitidos permanecen válidos hasta su expiración máxima de cinco minutos;
- esta microfase no implementa rate limits pedagógicos, `visitor_id`, estudios, telemetría ni persistencia académica cross-device.

## Seguridad y privacidad

- `GOOGLE_CLIENT_SECRET` y `BETTER_AUTH_SECRET` nunca usan prefijo `NEXT_PUBLIC_`;
- PostgreSQL no publica 5432 en OCI;
- OAuth tokens persistidos se cifran;
- `role` no es escribible por el cliente;
- FastAPI aplica 401 a token inválido y 403 a privilegio insuficiente;
- datos Google no se envían a un proveedor LLM por el mero hecho de iniciar sesión;
- la política de privacidad debe describir los datos de identidad/sesión almacenados.

## Validación requerida

La decisión se considera implementada cuando:

- migraciones auth parten de una DB limpia;
- usuario nuevo queda `USER`;
- no puede autoelevarse a `ADMIN`;
- login/logout/session funcionan con Google en el entorno configurado;
- JWT válido llega a `/auth/whoami`;
- token expirado, firma/issuer/audience incorrectos o `kid` inválido producen 401;
- USER recibe 403 en `/auth/admin/ping`;
- Docker E2E prueba sesión anónima y JWKS;
- build/smoke ARM64 sigue verde;
- las funciones pedagógicas anónimas continúan funcionando.

## Alternativas descartadas

- Auth implementada manualmente: aumenta superficie criptográfica y operativa.
- Contraseñas propias: almacenamiento, recuperación y políticas adicionales innecesarias.
- Auth0/Clerk/Cognito: dependencia/coste externo adicional para la escala del proyecto.
- Better Auth admin plugin: superficie mayor que el contrato `USER | ADMIN` requerido.
- Condición experimental como role: mezcla autorización con metodología y contamina el modelo académico.
- JWT largos con email/nombre: datos innecesarios en la frontera de servicio.

## Relacionado

- `adr-017-postgresql-self-hosted-oci.md`
- `../02-architecture/system-architecture.md`
- `../02-architecture/backend-architecture.md`
- `../02-architecture/frontend-architecture.md`
- `../02-architecture/data-flow.md`
