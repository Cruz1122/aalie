# Sistema de Diseño

Documentación del sistema de diseño, estilos y componentes visuales.

## Tecnologías

- **Tailwind CSS**: Framework utility-first
- **CSS Custom Properties**: Variables CSS
- **Glassmorphism**: Efectos de vidrio esmerilado
- **Material Symbols**: Iconografía

## Estructura de Estilos

```
src/
├── app/
│   └── globals.css          # Estilos globales y clases personalizadas
└── styles/
    └── highlight.css        # Estilos para syntax highlighting
```

## Clases Personalizadas

### Glassmorphism

#### `.glass-card`

Tarjeta con efecto de vidrio esmerilado.

```css
.glass-card {
  background: rgba(24, 36, 49, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
}
```

**Hover:**
- Aumenta opacidad
- Borde más visible
- Elevación

#### `.glass-secondary`

Variante secundaria con menos opacidad.

```css
.glass-secondary {
  background: rgba(34, 54, 73, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### `.glass-button`

Botón con efecto glassmorphism.

```css
.glass-button {
  background: rgba(13, 127, 242, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(13, 127, 242, 0.3);
  box-shadow: 0 4px 20px 0 rgba(13, 127, 242, 0.3);
}
```

#### `.glass-header`

Header con efecto glassmorphism.

```css
.glass-header {
  background: rgba(16, 26, 35, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(34, 54, 73, 0.5);
}
```

### Modales

#### `.glass-modal-overlay`

Overlay de modales.

#### `.glass-modal-container`

Contenedor de modales.

#### `.glass-modal-header`

Header de modales.

## Colores

### Paleta Principal

```css
:root {
  --primary-color: #0d7ff2;  /* Azul primario */
}
```

### Colores Tailwind Personalizados

```typescript
colors: {
  primary: "#0d7ff2",
  dark: {
    bg: "#101a23",
    card: "#182431",
    border: "#223649",
    text: "#90adcb",
  },
}
```

### Uso de Colores

- **Primary**: Botones principales, enlaces, acentos
- **Dark Text**: Texto secundario (`text-dark-text`)
- **White**: Texto principal
- **Semantic Colors**: 
  - Green: Éxito, confirmación
  - Red: Errores, advertencias críticas
  - Yellow: Advertencias
  - Blue: Información

## Tipografía

### Fuentes

- **Noto Sans**: Fuente principal
- **Spline Sans**: Fuente alternativa
- **Material Symbols**: Iconos

### Tamaños

- `text-xs`: 10px
- `text-sm`: 12px
- `text-base`: 14px
- `text-lg`: 16px
- `text-xl`: 18px
- `text-2xl`: 20px
- `text-3xl`: 24px
- `text-4xl`: 28px

## Espaciado

Sistema de espaciado de Tailwind:

- `p-1` a `p-8`: Padding
- `m-1` a `m-8`: Margin
- `gap-1` a `gap-8`: Gap en flex/grid

## Componentes Visuales

### Badges

```tsx
<span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
  Completado
</span>
```

### Cards

```tsx
<div className="glass-card p-6 rounded-xl">
  {/* Contenido */}
</div>
```

### Botones

```tsx
<button className="glass-button px-4 py-2 rounded-lg text-white">
  Analizar
</button>
```

### Inputs

```tsx
<input className="glass-secondary px-4 py-2 rounded-lg text-white" />
```

## Responsive Design

### Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Ejemplos

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid responsive */}
</div>

<p className="text-sm sm:text-base lg:text-lg">
  {/* Texto responsive */}
</p>
```

## Animaciones

### Transiciones

```css
transition: all 0.3s ease;
```

### Hover Effects

```tsx
<div className="hover:scale-105 transition-transform duration-300">
  {/* Efecto hover */}
</div>
```

### Loading Animations

```tsx
<div className="animate-pulse">
  {/* Loading */}
</div>
```

## Utilidades Tailwind

### Clases Comunes

- `flex`, `grid`: Layout
- `items-center`, `justify-between`: Alineación
- `rounded-lg`, `rounded-xl`: Bordes redondeados
- `shadow-lg`, `shadow-xl`: Sombras
- `opacity-50`, `opacity-75`: Opacidad

### Estados

- `hover:bg-white/10`: Hover
- `focus:outline-none`: Focus
- `disabled:opacity-40`: Disabled
- `active:scale-95`: Active

## Material Symbols

Iconos de Material Symbols:

```tsx
<span className="material-symbols-outlined text-primary text-xl">
  code
</span>
```

**Tamaños comunes:**
- `text-sm`: 16px
- `text-base`: 20px
- `text-lg`: 24px
- `text-xl`: 28px
- `text-2xl`: 32px
- `text-3xl`: 40px

## Dark Mode

La aplicación está diseñada para dark mode por defecto:

- Fondo oscuro: `#101a23`
- Texto claro: `#ffffff`
- Cards oscuras con transparencia

## Mejores Prácticas

1. **Consistencia**: Usar clases de glassmorphism consistentemente
2. **Responsive**: Siempre considerar mobile-first
3. **Accesibilidad**: Contraste adecuado, focus visible
4. **Performance**: Evitar animaciones pesadas
5. **Mantenibilidad**: Usar variables CSS cuando sea posible

