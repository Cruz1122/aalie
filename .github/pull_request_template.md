## Resumen

Describe el problema y la solución implementada.

## Alcance

- [ ] Motor de análisis / matemáticas
- [ ] Gramática / parser
- [ ] API / backend
- [ ] Web / interfaz
- [ ] Trazas / visualizaciones
- [ ] Exportaciones
- [ ] Contenido / quizzes
- [ ] Infraestructura / producción
- [ ] Solo documentación

## Validación

Lista las comprobaciones que realmente ejecutaste y su resultado.

```text
# Ejemplo
pnpm test:api:gate
pnpm lint:web
```

## Evidencia de comportamiento

Si este cambio modifica el comportamiento del análisis, incluye al menos una entrada representativa y la salida o clasificación exacta esperada utilizada como oráculo.

## Riesgo / compatibilidad

Indica limitaciones relevantes, migraciones, cambios de variables de entorno, impacto en despliegue o casos conocidos no soportados. Escribe `No aplica` cuando corresponda.

## Lista de verificación

- [ ] El cambio es enfocado y revisable.
- [ ] Las pruebas se actualizaron cuando cambió el comportamiento.
- [ ] La documentación se actualizó cuando cambiaron contratos u operación.
- [ ] No se incluyeron secretos ni credenciales de producción.
- [ ] No se añadió atribución generada por herramientas o bots en metadatos o mensajes de commit.
