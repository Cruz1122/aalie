# Política de seguridad

## Código con soporte

Las correcciones de seguridad se aplican a la rama `main` vigente. Los commits históricos, ramas abandonadas, forks locales y despliegues no soportados no se mantienen como líneas de soporte de seguridad.

## Reportar una vulnerabilidad

No publiques vulnerabilidades explotables en issues, solicitudes de cambios, discusiones o mensajes de commit públicos.

Reporta el problema de forma privada a los mantenedores del repositorio mediante un reporte privado de seguridad de GitHub cuando esa opción esté disponible. Si no está habilitada, contacta a un mantenedor a través de su perfil de GitHub y solicita un canal privado antes de compartir detalles de explotación.

Incluye, cuando sea posible:

- componente afectado y versión o commit;
- requisitos previos y superficie de ataque;
- pasos reproducibles o prueba de concepto;
- comportamiento esperado y observado;
- evaluación del impacto;
- mitigación sugerida, si la conoces.

No incluyas secretos reales de producción, datos personales ni credenciales de terceros en el reporte.

## Alcance

Entre los reportes relevantes se incluyen:

- evasión de autenticación o autorización;
- exposición de secretos;
- inyección de comandos, código o plantillas;
- manejo inseguro de archivos;
- SSRF o acceso de red no previsto;
- cross-site scripting o renderizado inseguro de HTML;
- vulnerabilidades de dependencias con una ruta de explotación creíble;
- debilidades del despliegue productivo que reduzcan de forma material el aislamiento o la integridad.

Los hallazgos puramente teóricos sin una ruta de ataque plausible también pueden ser útiles, pero deben identificarse como tales.

## Divulgación coordinada

Permite a los mantenedores un tiempo razonable para reproducir, corregir y desplegar una solución antes de divulgar públicamente la vulnerabilidad. Esta política no implica la existencia de un programa de recompensas o compensaciones.
