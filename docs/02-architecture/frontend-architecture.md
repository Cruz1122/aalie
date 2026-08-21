# Arquitectura frontend

**Tipo:** descriptiva  
**Estado:** final  
**Audiencia:** dev  
**Fuente de verdad:** `apps/web/src/app/`, `apps/web/src/components/`, `apps/web/src/lib/`, `apps/web/package.json`  
**Última revisión:** 2026-08-20  
**Relacionado con informe técnico:** UI, BFF, i18n, auth y estado local

## Propósito

Documentar las responsabilidades del frontend Next.js, el BFF y el subsistema opcional de identidad incorporado en la Microfase 2.

## Stack actual

| Tecnología | Versión / contrato | Uso |
|---|---|---|
| Next.js | 15.5.21 | App Router, Server Components y Route Handlers |
| React | 19.2.6 | UI |
| TypeScript | 5.5.4 | tipado estático |
| Better Auth | 1.7.1 | sesiones, Google OAuth, JWT/JWKS |
| `pg` | 8.x | conexión server-side de Better Auth a PostgreSQL |
| `next-intl` | 4.x | i18n es/en |
| Monaco Editor | 0.55.x | editor de pseudocódigo |
| KaTeX | 0.16.x | matemáticas |
| React Flow | 12.x | grafos y visualizaciones |

## Enrutamiento y superficies

Las superficies pedagógicas principales siguen bajo `/{locale}/...`: analyzer, examples, course, quizzes y user guide.

MF2 añade o consolida:

- `/{locale}/profile`: estado de identidad del usuario autenticado;
- `/{locale}/privacy`: política de privacidad actualizada para Google OAuth;
- `/{locale}/terms`: condiciones del servicio;
- `/api/auth/[...all]`: Route Handler de Better Auth.

El login no es una puerta de entrada obligatoria a `analyzer` ni a las funcionalidades pedagógicas existentes.

## BFF

Los Route Handlers bajo `apps/web/src/app/api/` mantienen el navegador desacoplado de la dirección interna de FastAPI.

El contrato de autenticación es distinto del proxy pedagógico:

- Better Auth gestiona sesión/callback/JWKS en `web`.
- FastAPI expone únicamente las rutas de auth que requieren JWT como prueba de la frontera de servicio.
- Las rutas actuales de análisis, trace, export, quizzes y LLM no se convierten automáticamente en privadas durante MF2.

## Better Auth

`apps/web/src/lib/auth.ts` configura Better Auth como código server-only.

### Base de datos

- Usa un `pg.Pool` compartido por proceso.
- Reescribe el `search_path` de la conexión a `auth`.
- Pool máximo: 10 conexiones.
- Timeouts acotados para conexión, query y statement.
- La DB URL es server-side; no existe `NEXT_PUBLIC_DATABASE_URL`.

### Google OAuth

Google es el único proveedor de login configurado. No se implementan contraseñas locales, magic links ni otros providers en esta microfase.

Secrets relevantes:

- `BETTER_AUTH_SECRET`;
- `GOOGLE_CLIENT_ID`;
- `GOOGLE_CLIENT_SECRET`.

Ninguno se expone mediante `NEXT_PUBLIC_*`.

### Usuario y roles

Better Auth extiende `user` con:

```text
role = USER | ADMIN
```

`role` tiene `USER` por defecto y `input:false`, por lo que el cliente no puede solicitar `ADMIN` durante sign-up/login. La promoción inicial se realiza explícitamente por operación administrativa.

La condición experimental futura `AALIE | CONTROL` no pertenece al objeto de autorización ni al role del usuario.

### Sesiones

- persistentes en PostgreSQL;
- expiración de 7 días;
- `updateAge` de 24 h;
- sin `cookieCache` en la configuración actual, para no permitir que un cambio de rol dependa de una copia de sesión cacheada en cookie.

`AuthControls` presenta login/logout/perfil. `ProfileView` contempla loading, error, anonymous y authenticated sin redirigir al usuario anónimo fuera de la aplicación.

## JWT y JWKS

El plugin JWT de Better Auth emite tokens de servicio:

- EdDSA / Ed25519;
- expiración 5 min;
- issuer y audience por entorno;
- subject = `user.id`;
- payload adicional = `role`.

`/api/auth/jwks` publica las claves públicas. FastAPI consume ese endpoint mediante la red interna de Compose.

Para `/api/auth/token`, el Route Handler comprueba primero una sesión autoritativa mediante `disableCookieCache:true`; si la sesión ya no es válida, devuelve 401 y no delega el minting del token.

## Privacidad de OAuth

La política pública refleja que, al elegir Google, AALIE puede persistir información básica de identidad y datos técnicos de sesión. `account.encryptOAuthTokens: true` protege credenciales OAuth persistidas por Better Auth.

El login:

- no se usa para publicidad;
- no envía datos a un proveedor LLM por el solo hecho de autenticarse;
- no implica inscripción ni consentimiento de investigación.

## Estado y persistencia pedagógica

MF2 no migra el progreso académico a PostgreSQL.

| Storage | Contenido |
|---|---|
| `sessionStorage` | estado efímero del análisis actual |
| `localStorage` | progreso local existente de contenido/quizzes y otros estados compatibles |
| PostgreSQL | identidad, sesiones, cuentas OAuth/JWKS |

La sincronización cross-device pertenece a una microfase posterior.

## Errores y degradación

- Si el usuario no inicia sesión, las funciones pedagógicas siguen disponibles.
- Error/cancelación OAuth vuelve a estado anónimo; no inutiliza el analizador.
- Un fallo del backend pedagógico mantiene los contratos de error BFF existentes.
- La ausencia de configuración Better Auth es un error de configuración del contenedor web, no un motivo para introducir secretos en el cliente.

## Tests

Vitest cubre estados de `AuthControls` y `ProfileView`, y forma parte del gate bloqueante de CI. Docker E2E también comprueba los endpoints de sesión anónima y JWKS.

## Límites de esta microfase

- No hay cuotas distintas para anónimo/autenticado en las features pedagógicas.
- Better Auth solo aplica sus propios límites de autenticación.
- No hay `visitor_id` de producto para sesiones anónimas.
- No hay persistencia server-side del progreso académico.
- No hay enrolamiento de estudio ni UI de consentimiento experimental.

## Archivos relacionados

- `system-architecture.md`
- `backend-architecture.md`
- `data-flow.md`
- `../09-decisions/adr-018-google-oauth-better-auth-jwt.md`
