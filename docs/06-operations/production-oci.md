# Producción OCI de AALIE

**Tipo:** guía operacional canónica
**Estado:** final
**Audiencia:** operador | DevOps | mantenedor
**Fuente de verdad:** `infra/oci/`, `.github/workflows/arm64-validation.yml`, `scripts/smoke_prod.py`
**Última revisión:** 2026-08-19

## 1. Alcance y objetivo

Este es el procedimiento normativo para reconstruir y operar `aalie.dev` desde cero usando el repositorio y credenciales entregadas por canales externos. No cubre desarrollo local; para eso existe `local-development.md`. Ninguna clave, token o `.env` productivo pertenece al repositorio.

La VM no compila AALIE. GitHub Actions construye imágenes ARM64, las publica en GHCR con el SHA Git completo y ordena al host descargar ese SHA. El alias `latest-arm64` puede existir como conveniencia de registry, pero no participa en deploy ni rollback.

## 2. Arquitectura que se debe reproducir

```text
Internet
  └─ aalie.dev :80/:443
       └─ Caddy (TLS automático, único servicio publicado)
            └─ web:3000 (Next.js standalone + BFF, red privada)
                 └─ api:8000 (FastAPI, red privada)
                      └─ postgres:5432 (PostgreSQL, red privada y sin puerto publicado)
```

El navegador solo conoce Caddy y Next.js. Los Route Handlers `/api/*` del BFF llaman a `http://api:8000`; FastAPI no tiene puerto publicado en el host ni regla de ingreso OCI.

## 3. Recursos OCI requeridos

Región validada: `us-ashburn-1`.

| Recurso | Configuración reproducible |
|---|---|
| Compute | `VM.Standard.A1.Flex`, ARM64/aarch64, 2 OCPU, 12 GB RAM |
| Imagen | Ubuntu 24.04 LTS para ARM64 |
| Disco raíz | Aproximadamente 50 GB |
| VCN | `vcn-aalie-prod`, `10.0.0.0/16` |
| Subnet pública | `subnet-aalie-public`, `10.0.1.0/24` |
| Internet Gateway | `igw-aalie-prod` |
| Ruta | `0.0.0.0/0` hacia `igw-aalie-prod` |
| Ingress público | TCP 22, 80 y 443 únicamente |

En la consola OCI, cree la VCN, subnet, Internet Gateway y regla de ruta con esos valores; después cree la instancia y asígnele una IPv4 pública. Restrinja 22 a rangos administrativos cuando sea viable. Los puertos 80/443 son públicos porque Caddy debe atender HTTP, ACME y HTTPS. Los puertos 3000/8000 quedan solo en la red bridge `aalie-internal`: exponerlos omitiría TLS/BFF y ampliaría innecesariamente la superficie de ataque.

Use el networking recomendado por OCI para Ampere; las imágenes de plataforma A1 usan networking paravirtualizado. No trate la IP pública como identidad permanente: el registro DNS `aalie.dev` es la identidad estable.

## 4. Preparar DNS

En el proveedor DNS cree o actualice el registro `A` de `aalie.dev` hacia la IPv4 pública asignada a la VM. Espere propagación antes de iniciar Caddy; Caddy necesita que el dominio resuelva al host y que 80/443 sean alcanzables para obtener el certificado.

Desde una estación administrativa ejecute:

```bash
dig +short aalie.dev
```

Este comando solo consulta DNS, no modifica sistemas. Debe devolver la IPv4 pública actual de la VM; si no coincide, no continúe con TLS.

## 5. Acceso inicial y verificación del host

Conserve la clave privada administrativa fuera del repositorio y conecte como el usuario de la imagen:

```bash
ssh -i /ruta/segura/aalie-admin ubuntu@aalie.dev
```

El comando abre una sesión remota y no modifica el host por sí mismo. Se espera un shell de `ubuntu`; confirme por un canal confiable el fingerprint mostrado la primera vez.

```bash
uname -m
source /etc/os-release && printf '%s %s\n' "$NAME" "$VERSION_ID"
df -h /
```

Son comprobaciones de solo lectura. Deben mostrar `aarch64`, Ubuntu `24.04` y un filesystem raíz cercano a 50 GB.

## 6. Instalar Docker Engine y Compose

Use el repositorio APT oficial de Docker, no el convenience script. Los siguientes comandos modifican paquetes y configuración APT: instalan prerequisitos, agregan la clave/repositorio oficial e instalan Engine, Buildx y el plugin Compose. Se espera que terminen sin errores y que `docker.service` quede activo.

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

Habilite al operador `ubuntu` para usar Docker. Esto modifica su membresía de grupo y concede privilegios equivalentes a root mediante Docker; hágalo solo para la cuenta administrativa. La nueva membresía aplica al volver a iniciar sesión.

```bash
sudo usermod -aG docker ubuntu
exit
```

Abra una nueva sesión SSH y verifique, sin cambiar estado:

```bash
docker version
docker compose version
systemctl is-active docker
```

Se esperan versión de cliente/servidor, una versión de Compose v2 y `active`.

## 7. Instalar los artefactos versionados

En la estación que contiene un checkout confiable del repositorio, copie solo los artefactos de runtime. `scp` modifica `/home/ubuntu/aalie` en el host; se esperan tres archivos transferidos correctamente.

```bash
ssh -i /ruta/segura/aalie-admin ubuntu@aalie.dev 'install -d -m 0755 /home/ubuntu/aalie'
scp -i /ruta/segura/aalie-admin \
  infra/oci/compose.yml infra/oci/Caddyfile infra/oci/scripts/host-health.sh \
  infra/oci/scripts/postgres-backup.sh infra/oci/scripts/postgres-restore.sh \
  ubuntu@aalie.dev:/home/ubuntu/aalie/
```

Instale el deploy y el baseline SSH desde la estación. Los dos `scp` escriben temporales bajo `/tmp`; los `install` posteriores crean archivos root-owned con modos explícitos.

```bash
scp -i /ruta/segura/aalie-admin \
  infra/oci/deploy/aalie-deploy \
  ubuntu@aalie.dev:/tmp/aalie-deploy
scp -i /ruta/segura/aalie-admin \
  infra/oci/ssh/99-aalie-hardening.conf \
  ubuntu@aalie.dev:/tmp/99-aalie-hardening.conf
ssh -i /ruta/segura/aalie-admin ubuntu@aalie.dev \
  'sudo install -o root -g root -m 0755 /tmp/aalie-deploy /usr/local/bin/aalie-deploy &&
   sudo install -o root -g root -m 0644 /tmp/99-aalie-hardening.conf /etc/ssh/sshd_config.d/99-aalie-hardening.conf'
```

Mantenga abierta la sesión administrativa existente y valide inmediatamente la configuración SSH antes de cualquier `reload` y antes de cerrar esa sesión:

```bash
sudo sshd -t
```

El comando debe terminar sin salida y con código 0. Si falla, no recargue SSH; corrija el archivo y vuelva a validar.

En la VM normalice owner y modos. Estos comandos modifican metadatos, no contenidos; se espera que `stat` muestre exactamente los valores indicados.

```bash
sudo chown ubuntu:ubuntu /home/ubuntu/aalie/compose.yml \
  /home/ubuntu/aalie/Caddyfile /home/ubuntu/aalie/host-health.sh
chmod 0644 /home/ubuntu/aalie/compose.yml /home/ubuntu/aalie/Caddyfile
chmod 0755 /home/ubuntu/aalie/host-health.sh
chmod 0755 /home/ubuntu/aalie/postgres-backup.sh /home/ubuntu/aalie/postgres-restore.sh
stat -c '%U:%G %a %n' \
  /home/ubuntu/aalie/compose.yml \
  /home/ubuntu/aalie/Caddyfile \
  /home/ubuntu/aalie/host-health.sh \
  /home/ubuntu/aalie/postgres-backup.sh \
  /home/ubuntu/aalie/postgres-restore.sh \
  /usr/local/bin/aalie-deploy \
  /etc/ssh/sshd_config.d/99-aalie-hardening.conf
```

## 8. Crear estado de imagen y validar configuración

Elija un SHA de 40 caracteres cuyo workflow ARM64 haya publicado ambas imágenes. Este bloque crea `.env` de forma privada; modifica el host y debe mostrar modo `600`. `AALIE_TAG` no es secreto, pero el archivo se protege porque es estado de despliegue.

```bash
cd /home/ubuntu/aalie
umask 077
printf '%s\n' 'AALIE_TAG=<40-char-lowercase-git-sha>' > .env
chmod 0600 .env
stat -c '%U:%G %a %n' .env

DB_PASSWORD="$(openssl rand -hex 32)"
umask 077
cat > .env.runtime <<EOF
POSTGRES_DB=aalie
POSTGRES_USER=aalie
POSTGRES_PASSWORD=${DB_PASSWORD}
API_DATABASE_URL=postgresql+psycopg://aalie:${DB_PASSWORD}@postgres:5432/aalie
WEB_DATABASE_URL=postgresql://aalie:${DB_PASSWORD}@postgres:5432/aalie
EOF
unset DB_PASSWORD
chmod 0600 .env.runtime
stat -c '%U:%G %a %n' .env.runtime
```

Reemplace el placeholder antes de ejecutar. Valide Compose y Caddy. Compose renderiza la configuración y Caddy comprueba sintaxis; ambos son read-only respecto de servicios, aunque el segundo puede descargar la imagen Caddy si aún no existe. Se espera salida válida y exit code 0.

```bash
docker compose --env-file .env --env-file .env.runtime -f compose.yml config --quiet
docker run --rm \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2.11.4-alpine \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

## 9. Primer pull y primer arranque

Las imágenes GHCR se esperan legibles por la VM. Si el registry se vuelve privado, configure en el host una credencial `read:packages` entregada externamente y agréguela al inventario; no la escriba en Compose ni en el repositorio.

```bash
docker compose --env-file .env --env-file .env.runtime -f compose.yml pull api web caddy postgres
docker compose --env-file .env --env-file .env.runtime -f compose.yml up -d --wait postgres
docker compose --env-file .env --env-file .env.runtime -f compose.yml run --rm --no-deps api alembic upgrade head
docker compose --env-file .env --env-file .env.runtime -f compose.yml up -d --wait
docker compose --env-file .env --env-file .env.runtime -f compose.yml ps
```

`pull` modifica el almacenamiento local de imágenes; `up` crea/actualiza red, volúmenes y contenedores. Se espera `api` y `web` healthy y `caddy` running. Solo Caddy debe mostrar bindings host para 80/443.

Caddy monta el archivo versionado y persiste certificados/estado en `caddy-data` y `caddy-config`. El site label `aalie.dev` activa HTTPS automático; Caddy obtiene y renueva TLS si DNS y red son correctos.

## 10. Health y smoke funcional

Compruebe primero la API desde dentro del contenedor. Este comando no publica 8000 ni modifica estado; debe responder JSON con `status: ready` y todos los checks en `true`, incluido `postgresql`.

```bash
cd /home/ubuntu/aalie
docker compose --env-file .env --env-file .env.runtime -f compose.yml exec -T api python -c \
  "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/health/ready', timeout=30).read().decode())"
```

Desde un checkout del repositorio ejecute el smoke completo contra la superficie pública. `AALIE_API_URL` vacío evita intentar alcanzar FastAPI desde Internet; readiness ya fue comprobada en el paso anterior. El script solo hace requests funcionales, aunque crea una sesión efímera de quiz y genera artefactos de exportación temporales en API. Debe terminar con `production smoke: PASS`.

```bash
AALIE_BASE_URL=https://aalie.dev AALIE_API_URL= python3 scripts/smoke_prod.py
```

El contrato cubre `/es`, `/api/health`, parse, análisis FOR/WHILE/recursivo, trace, quiz, Markdown, LaTeX, PDF (incluidos `Content-Type` y `%PDF`) y ZIP.

## 11. Hardening SSH

El baseline versionado se instala en `/etc/ssh/sshd_config.d/99-aalie-hardening.conf`, owner `root:root`, modo `0644`. Mantenga una sesión administrativa abierta durante todo cambio. Valide antes de reload; si `sshd -t` no produce salida y retorna 0, la sintaxis es válida. `reload` modifica el proceso activo sin cortar deliberadamente sesiones existentes.

```bash
sudo systemctl reload ssh
```

En una segunda terminal pruebe una sesión nueva con la clave administrativa. Solo después cierre la sesión de respaldo. Nunca reinicie SSH a ciegas, habilite contraseña/root ni agregue claves al archivo versionado.

Permisos esperados:

```text
/home/ubuntu/.ssh                  ubuntu:ubuntu 0700
/home/ubuntu/.ssh/authorized_keys  ubuntu:ubuntu 0600
/home/ubuntu/aalie/.env            ubuntu:ubuntu 0600
compose.yml y Caddyfile             ubuntu:ubuntu 0644
/usr/local/bin/aalie-deploy         root:root     0755
99-aalie-hardening.conf             root:root     0644
```

## 12. Clave administrativa y deploy key de CI

La clave administrativa es interactiva y se recomienda generarla protegida con passphrase, desbloqueándola mediante entrada interactiva o un agente local. La clave de CI es distinta y queda restringida por línea en `authorized_keys`; no se aplican prohibiciones globales de forwarding a la cuenta administrativa solo para limitar CI.

El workflow actual usa `ssh -i` de forma no interactiva con `BatchMode=yes`; no implementa agente ni desbloqueo de passphrase. La estrategia elegida para esta clave CI es un par Ed25519 dedicado sin passphrase, almacenado únicamente como `OCI_SSH_PRIVATE_KEY` en el Environment protegido de GitHub y rotado según este documento. Una clave cifrada con passphrase no funcionará automáticamente en el workflow actual: requeriría un mecanismo de desbloqueo explícito que no forma parte de esta fase.

La clave administrativa permite operación interactiva. La clave de CI debe ser distinta y quedar restringida por línea en `authorized_keys`; no aplique prohibiciones globales de forwarding a la cuenta administrativa solo para limitar CI.

En una estación segura genere la clave CI. Este comando crea dos archivos sensibles locales; la privada nunca se copia a la VM ni al repo y la pública sí se instala.

```bash
ssh-keygen -t ed25519 -a 100 -f ./aalie-ci-deploy -C aalie-ci-deploy
```

En la VM agregue la pública con la restricción fuerte soportada por OpenSSH actual. El comando modifica `authorized_keys`; reemplace el placeholder por una única clave pública y espere que una conexión con esa clave solo pueda ejecutar el forced command.

```bash
install -d -m 0700 /home/ubuntu/.ssh
printf '%s\n' 'restrict,command="/usr/local/bin/aalie-deploy" ssh-ed25519 <DEPLOY_PUBLIC_KEY> aalie-ci-deploy' \
  >> /home/ubuntu/.ssh/authorized_keys
chmod 0600 /home/ubuntu/.ssh/authorized_keys
```

El script acepta exclusivamente `deploy <40-char-lowercase-hex-SHA>` desde `SSH_ORIGINAL_COMMAND`; cualquier otro texto responde `Rejected command` y falla.

## 13. GitHub Environment y secretos

Configure el Environment cuyo nombre usa el workflow: `Production – aalie`. Restrinja deployment a `main` y habilite los reviewers/reglas que el equipo decida. Registre allí:

- `OCI_SSH_PRIVATE_KEY`: privada de la deploy key CI.
- `OCI_SSH_KNOWN_HOSTS`: línea verificada de host key para `aalie.dev`.

El job obtiene estos valores solo después de superar las reglas del Environment. El workflow usa comprobación estricta por defecto: no configure `StrictHostKeyChecking=no`.

## 14. Inventario de secretos y material de confianza

| Elemento | Naturaleza | Dónde vive | Consumidor | Rotación | Impacto si se pierde/filtra |
|---|---|---|---|---|---|
| Clave privada SSH administrativa OCI | Secreto crítico | Gestor seguro del operador, fuera del repo/VM | Administrador humano | Periódica, al cambiar responsables o ante sospecha | Pérdida: acceso operativo; filtración: control de la cuenta `ubuntu` |
| Pública administrativa | Material público autorizado | `/home/ubuntu/.ssh/authorized_keys` | OpenSSH | Junto con su privada | Eliminación prematura: lockout; alteración: acceso no autorizado |
| `OCI_SSH_PRIVATE_KEY` | Secreto crítico | Secret del Environment `Production – aalie` | Job `deploy-production` | Periódica y ante exposición | Pérdida: CD detenido; filtración: intentos limitados por forced command |
| Pública deploy CI | Material público autorizado | `authorized_keys`, con `restrict,command=...` | OpenSSH | Junto con privada CI | Sin restricción: amplía impacto de una filtración; pérdida: CD detenido |
| `OCI_SSH_KNOWN_HOSTS` | Material de confianza/host pinning, no equivale a una privada | Secret del Environment | Cliente SSH de Actions | Cuando cambia legítimamente la host key, tras verificación externa | Incorrecto: despliegue bloqueado o riesgo MITM si se sustituye sin verificar |
| API key LLM del servidor | Secreto condicional | No aparece en `infra/oci/compose.yml`; solo gestor/runtime externo si el operador habilita LLM | API | Según proveedor y ante exposición | Filtración: consumo/cuota; pérdida: solo funciones LLM, no motor determinista |
| Credencial GHCR de lectura | Secreto condicional | Docker credential store del host, solo si paquetes dejan de ser públicos | Docker Engine | Según token y ante exposición | Pérdida: pulls bloqueados; filtración: alcance `read:packages` |

No hay evidencia versionada de una API key LLM ni de una credencial GHCR en la producción actual; no se deben inventar ni declarar como instaladas.

## 15. Rotación segura de SSH

### A. Clave administrativa

1. Genere un par nuevo fuera del repo con `ssh-keygen -t ed25519 -a 100 -f <ruta-segura>`; crea archivos locales.
2. Con la sesión vieja abierta, agregue la nueva pública a `authorized_keys`; modifica acceso autorizado.
3. Abra una segunda sesión usando la nueva privada y ejecute `id`; es una prueba de lectura.
4. Solo tras el éxito elimine exactamente la línea pública vieja y conserve modo `0600`.
5. Pruebe otra conexión antes de cerrar la sesión original.

### B. Deploy key de GitHub Actions

1. Genere un par CI nuevo en una estación segura.
2. Agregue su pública como una segunda línea `restrict,command="/usr/local/bin/aalie-deploy" ...`; no retire aún la anterior.
3. Pruebe que una orden inválida sea rechazada y que un deploy controlado de un SHA ya publicado sea aceptado.
4. Reemplace `OCI_SSH_PRIVATE_KEY` en el Environment de GitHub.
5. Ejecute un deployment controlado desde `main` y confirme smoke.
6. Retire únicamente la pública CI anterior y vuelva a probar.

### C. Host key / known_hosts

Desde una red confiable genere un candidato. `ssh-keyscan` solo recolecta claves y no las autentica; no modifique GitHub todavía.

```bash
ssh-keyscan -t ed25519,rsa aalie.dev > /tmp/aalie-known-hosts.candidate
ssh-keygen -lf /tmp/aalie-known-hosts.candidate
```

Compare esos fingerprints por un canal independiente con `sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` ejecutado en la consola OCI. Solo si coinciden, reemplace `OCI_SSH_KNOWN_HOSTS` con el contenido candidato y pruebe el workflow. Los comandos de fingerprint son read-only; la actualización del Environment cambia el pin de confianza.

## 16. Instalar y probar el deploy forzado

La instalación de `/usr/local/bin/aalie-deploy` ya quedó descrita en el paso 7. Pruebe primero rechazo con la deploy key; no debe cambiar contenedores:

```bash
ssh -i ./aalie-ci-deploy -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@aalie.dev 'uname -a'
```

Resultado esperado: `Rejected command` y exit distinto de cero.

Para desplegar un SHA publicado, el workflow ejecuta:

```bash
ssh -i ./aalie-ci-deploy -o IdentitiesOnly=yes -o BatchMode=yes \
  ubuntu@aalie.dev 'deploy <40-char-lowercase-git-sha>'
```

Esto sí modifica producción: valida la orden, descarga ambas imágenes, cambia `.env` atómicamente, ejecuta Compose con `--wait`, valida API readiness y web health internos, y guarda el SHA anterior en `.previous-tag`. Si falla, restaura `.env`, vuelve a levantar el SHA anterior y retorna 1.

## 17. Política CURRENT_SHA / PREVIOUS_SHA y rollback

- `CURRENT_SHA`: valor `AALIE_TAG` de `/home/ubuntu/aalie/.env`.
- `PREVIOUS_SHA`: contenido de `/home/ubuntu/aalie/.previous-tag` tras el primer update exitoso.
- Ambos son SHAs inmutables; `latest-arm64` no es aceptable para rollback.
- En un fallo, `.env` vuelve al SHA viejo y `.previous-tag` no se sobrescribe.

Para un rollback administrativo lea y valide el estado. Estos comandos son read-only:

```bash
cd /home/ubuntu/aalie
grep -E '^AALIE_TAG=[0-9a-f]{40}$' .env
grep -E '^[0-9a-f]{40}$' .previous-tag
```

Después ejecute el SHA anterior a través del mismo contrato transaccional. Este comando modifica producción y, si tiene éxito, deja el SHA que estaba activo como nuevo `PREVIOUS_SHA`:

```bash
PREVIOUS_TAG="$(tr -d '\r\n' < /home/ubuntu/aalie/.previous-tag)"
[[ "$PREVIOUS_TAG" =~ ^[0-9a-f]{40}$ ]]
sudo -u ubuntu env SSH_ORIGINAL_COMMAND="deploy ${PREVIOUS_TAG}" /usr/local/bin/aalie-deploy
```

Ejecute después health y smoke completos.

## 18. Política de patching del host

Estado/política validada: Ubuntu 24.04 usa `unattended-upgrades`; `apt-daily.timer` y `apt-daily-upgrade.timer` permanecen activos. Security/ESM puede instalarse automáticamente. No se habilita reboot automático. Un kernel nuevo se activa en una ventana de reboot manual. Docker proviene de `download.docker.com`; Engine y Compose se actualizan en una ventana revisada y nunca mediante un major silencioso.

Audite la configuración sin modificarla:

```bash
systemctl is-enabled apt-daily.timer apt-daily-upgrade.timer
systemctl is-active apt-daily.timer apt-daily-upgrade.timer
grep -R 'Unattended-Upgrade::Automatic-Reboot' /etc/apt/apt.conf.d/
grep -R 'download.docker.com' /etc/apt/sources.list /etc/apt/sources.list.d/ 2>/dev/null
```

Se esperan timers enabled/active, reboot automático ausente o `false`, y el repositorio oficial Docker. Confirme que los orígenes autorizados de unattended-upgrades no incluyan Docker; los repositorios de terceros no se incorporan automáticamente por el solo hecho de agregarlos.

### Pre-patch

Estos comandos son read-only y establecen la línea base:

```bash
cd /home/ubuntu/aalie
./host-health.sh
docker compose --env-file .env -f compose.yml ps
curl --fail --silent --show-error https://aalie.dev/api/health
test -f /run/reboot-required && cat /run/reboot-required.pkgs || true
```

### Aplicación revisada

`apt-get update` refresca índices; `apt-get upgrade` modifica paquetes. Revise la lista antes de aceptar y ejecute en ventana de mantenimiento. No habilite `Automatic-Reboot`.

```bash
sudo apt-get update
apt list --upgradable
sudo apt-get upgrade
```

Para Docker, consulte versiones y seleccione explícitamente una versión aprobada; los dos primeros comandos son read-only y el último modifica Docker/Compose:

```bash
apt-cache madison docker-ce
docker version && docker compose version
sudo apt-get install docker-ce=<VERSION_APROBADA> docker-ce-cli=<VERSION_APROBADA> \
  containerd.io docker-buildx-plugin docker-compose-plugin
```

### Post-patch y kernel

Repita `systemctl is-active docker`, `docker compose ps`, `host-health.sh`, readiness interna y el smoke completo. Si existe `/run/reboot-required`, anuncie ventana y ejecute `sudo reboot`; este comando reinicia la VM y causa indisponibilidad temporal. Tras reconectar repita todo el recovery checklist. No automatice este reboot.

## 19. Control de disco y limpieza conservadora

Ejecute semanalmente y antes/después de patch o deploy:

```bash
cd /home/ubuntu/aalie
./host-health.sh
```

Es read-only. Reporta `/`, `docker system df`, journals, Docker/Compose y SHAs. Retorna 0 en OK, 1 en WARNING y 2 en CRITICAL.

| Uso de `/` | Estado | Respuesta |
|---:|---|---|
| `< 70%` | OK | Seguimiento normal |
| `70–84%` | WARNING | Diagnosticar y programar acción |
| `>= 85%` | CRITICAL | Detener despliegues no esenciales y liberar espacio con revisión |

Orden obligatorio de diagnóstico, todo read-only:

```bash
df -h /
docker system df -v
journalctl --disk-usage
docker image ls 'ghcr.io/cruz1122/aalie-*' --digests
docker ps -a --format '{{.Image}} {{.Names}} {{.Status}}'
```

Primero identifique si crecen filesystem, imágenes o journal. Nunca ejecute `docker system prune -a` como reacción automática. Conserve siempre las imágenes de `CURRENT_SHA`, `PREVIOUS_SHA` y cualquier imagen referenciada por contenedores. Si una imagen AALIE concreta quedó fuera de esas tres categorías, `docker image rm <ID_VERIFICADO>` la elimina y sí modifica datos; ejecute solo con ID explícito tras documentar la comparación. Para journals use una retención acordada y específica, no borrado indiscriminado.

## 20. Reboot test y recuperación

En una ventana anunciada ejecute `sudo reboot`; modifica el estado del host y corta temporalmente conexiones. `restart: unless-stopped` debe recuperar los tres contenedores después de que Docker arranque. Una ventana breve de 502 es posible mientras health pasa de `starting` a `healthy`; no debe persistir.

Si el host no recupera:

1. use consola OCI para confirmar boot y red;
2. confirme `docker.service` y espacio;
3. valide Compose/Caddy;
4. inspeccione `docker compose logs --tail=200` (solo lectura);
5. restaure el `PREVIOUS_SHA` mediante el deploy transaccional si la imagen activa es la causa;
6. no borre volúmenes `caddy-data`/`caddy-config`, pues contienen estado TLS.

## 21. Recovery checklist

Después de reboot, patch, cambio Docker, reprovisión, cambio Caddy o rollback:

- [ ] `systemctl is-active docker` devuelve `active`.
- [ ] `docker compose --env-file .env --env-file .env.runtime -f compose.yml ps` muestra PostgreSQL, API, web y Caddy.
- [ ] `aalie-api` está healthy.
- [ ] `aalie-web` está healthy.
- [ ] `aalie-caddy` está running.
- [ ] `https://aalie.dev/es` devuelve HTML.
- [ ] `https://aalie.dev/api/health` confirma API por BFF.
- [ ] `/health/ready` pasa desde dentro de API.
- [ ] parse funciona.
- [ ] analyze funciona para casos representativos.
- [ ] trace funciona.
- [ ] quiz crea/evalúa sesión.
- [ ] PDF devuelve `application/pdf` y `%PDF`.
- [ ] `host-health.sh` no reporta CRITICAL.
- [ ] `CURRENT_SHA` es el esperado.
- [ ] `PREVIOUS_SHA` es válido o se documenta que aún no existe por ser primer deploy.

Los puntos funcionales se cubren con `scripts/smoke_prod.py`; no se sustituyen por simples checks 200.

## 22. Mantenimiento de imágenes y estado

Revise después de deployments, no durante cada deploy. No hay prune automático. Mantenga como mínimo los dos SHAs operables y valide periódicamente que ambas etiquetas sigan disponibles en GHCR. Los volúmenes Caddy son persistentes y no forman parte de la limpieza de imágenes.

Antes de modificar `compose.yml`, `Caddyfile`, hardening o deploy, actualice primero los archivos de `infra/oci/`, valide en CI y después sincronice la VM. Una edición exclusiva en el host vuelve a crear drift.

## 23. Dry-run de reconstrucción

Este checklist permite auditar una reconstrucción sin tocar la VM productiva:

- [ ] Recursos OCI, región, shape, RAM, disco y Ubuntu descritos.
- [ ] VCN `10.0.0.0/16`, subnet `10.0.1.0/24`, IGW, ruta e ingress descritos.
- [ ] Instalación Docker desde repositorio oficial descrita.
- [ ] `AALIE_TAG=0000000000000000000000000000000000000000 POSTGRES_DB=aalie POSTGRES_USER=aalie POSTGRES_PASSWORD=ci API_DATABASE_URL=postgresql+psycopg://aalie:ci@postgres:5432/aalie WEB_DATABASE_URL=postgresql://aalie:ci@postgres:5432/aalie docker compose -f infra/oci/compose.yml config --quiet` pasa.
- [ ] Config renderizada demuestra 80/443 solo en Caddy y ningún publish 3000/8000.
- [ ] Caddyfile pasa `caddy:2.11.4-alpine caddy validate`.
- [ ] `bash -n infra/oci/deploy/aalie-deploy` pasa.
- [ ] `bash -n infra/oci/scripts/host-health.sh` pasa.
- [ ] Baseline SSH y secuencia `sshd -t` están documentados.
- [ ] Archivos, rutas destino, owners y modos están enumerados.
- [ ] Inventario de secretos/material de confianza está completo y sin valores reales.
- [ ] Rotaciones admin, CI y known_hosts están completas.
- [ ] Patching conserva unattended security/ESM, reboot manual y Docker revisado.
- [ ] Política de disco 70/85 y diagnóstico conservador están completas.
- [ ] CURRENT/PREVIOUS y rollback por SHA están completos.
- [ ] Smoke cubre health, readiness y funcionalidad crítica.
- [ ] Recovery checklist y reboot test están completos.
- [ ] DNS `aalie.dev`, GitHub Environment y secrets están enumerados.

## 24. Persistencia, backup y restore

El volumen `postgres-data` conserva la base entre reinicios y entre `docker compose down`/`up`. No ejecute `docker compose down -v` en OCI: elimina el volumen nombrado y sus datos. Para validaciones destructivas use siempre otro proyecto Compose y otro volumen.

El backup por defecto crea un archivo custom comprimido con nombre UTC bajo `backups/`, modo `0600`, y elimina el parcial si `pg_dump` falla:

```bash
cd /home/ubuntu/aalie
./postgres-backup.sh
./postgres-backup.sh /home/ubuntu/aalie/backups/manual-$(date -u +%Y%m%dT%H%M%SZ).dump
```

El restore exige un archivo válido y una base destino vacía. Use una base separada; el script valida que no existan tablas de usuario y ejecuta `pg_restore --exit-on-error --no-owner --no-privileges`:

```bash
docker compose --env-file .env --env-file .env.runtime -f compose.yml exec -T postgres \
  sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" createdb --host=127.0.0.1 --username="$POSTGRES_USER" aalie_restore_check'
./postgres-restore.sh /home/ubuntu/aalie/backups/manual-<UTC>.dump aalie_restore_check
```

Los backups permanecen inicialmente en el mismo disco de 50 GB y no constituyen DR off-host. Verifique espacio antes de respaldar y transfiera una copia a un destino externo mediante un procedimiento aprobado.

## 25. Deploy y compatibilidad de esquema

El deploy carga simultáneamente `.env` y `.env.runtime`, actualiza solo la línea `AALIE_TAG` y conserva las demás variables. Antes de levantar API/web espera PostgreSQL saludable y ejecuta `alembic upgrade head`. Un rollback revierte las imágenes, nunca hace downgrade del esquema; las migraciones nuevas deben ser compatibles con la imagen anterior.

## 26. Referencias oficiales

- [OCI: crear una instancia y shapes Ampere](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm)
- [OCI: conceptos de networking](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/overview.htm)
- [OCI: route tables y reglas](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingroutetables_topic-working.htm)
- [Docker Engine en Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose plugin en Linux](https://docs.docker.com/compose/install/linux/)
- [Ubuntu Server: actualizaciones automáticas](https://documentation.ubuntu.com/server/how-to/software/automatic-updates/)
- [Ubuntu 24.04 LTS](https://documentation.ubuntu.com/release-notes/24.04/)
- [OpenSSH `sshd_config`](https://man.openbsd.org/sshd_config)
- [OpenSSH `authorized_keys`, `restrict` y forced command](https://man.openbsd.org/sshd.8)
- [Caddy: HTTPS automático](https://caddyserver.com/docs/automatic-https)
- [Caddy: `reverse_proxy`](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [GitHub Actions: deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)
- [GitHub Actions: administrar environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)

### Smoke público posterior al deploy

El job `deploy-production` ejecuta el smoke público completo únicamente después de que el deploy remoto termina con éxito. Si ese smoke falla, el workflow falla, pero actualmente no existe rollback automático por un fallo externo de DNS, red o disponibilidad pública. Diagnostique primero; si el runtime realmente quedó defectuoso, use manualmente `PREVIOUS_SHA` mediante el procedimiento de rollback documentado arriba y vuelva a ejecutar health y smoke.
