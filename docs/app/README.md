# Documentación de la Aplicación Web

Esta carpeta contiene la documentación técnica completa del frontend del analizador de complejidad algorítmica.

## Índice

- [Arquitectura](./architecture.md) - Arquitectura del frontend, estructura y organización
- [Componentes](./components.md) - Documentación de componentes principales y sus props
- [Sistema de Rutas](./routing.md) - Sistema de rutas y navegación
- [Gestión de Estado](./state-management.md) - Hooks personalizados y contextos
- [Sistema de Diseño](./styling.md) - Tailwind CSS, glassmorphism y estilos
- [Integración con API](./api-integration.md) - Cómo se integra con el backend

## Descripción General

La aplicación web está construida con **Next.js 14** (App Router) y **TypeScript**, proporcionando una interfaz de usuario moderna y reactiva para el análisis de complejidad algorítmica.

## Características Principales

- **Editor de Código**: Monaco Editor con validación en tiempo real
- **Análisis Interactivo**: Visualización de resultados con tablas, gráficos y fórmulas LaTeX
- **Chatbot con IA**: Asistente integrado para ayuda y análisis
- **Modo Manual y AI**: Dos modos de interacción
- **Visualizaciones**: AST, árboles de recursión, procedimientos detallados

## Tecnologías

- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utility-first
- **Monaco Editor**: Editor de código (VS Code en el navegador)
- **KaTeX**: Renderizado de fórmulas matemáticas
- **React Flow**: Visualización de árboles de recursión
- **Material Symbols**: Iconografía

## Estructura del Proyecto

```
apps/web/
├── src/
│   ├── app/              # Páginas (App Router)
│   ├── components/       # Componentes React
│   ├── hooks/           # Hooks personalizados
│   ├── lib/             # Utilidades y helpers
│   ├── contexts/         # Contextos React
│   ├── services/        # Servicios (API clients)
│   ├── types/           # Tipos TypeScript
│   ├── styles/          # Estilos globales
│   └── workers/         # Web Workers
├── public/              # Archivos estáticos
├── package.json
└── next.config.mjs
```

## Inicio Rápido

### Desarrollo

```bash
cd apps/web
pnpm install
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Producción

```bash
pnpm build
pnpm start
```

## Más Información

Para detalles específicos, consulta los documentos individuales en esta carpeta.

