# Estado actual UI: `course` y `quizzes`

**Estado:** reemplazado
**Reemplazado por:** `../03-specs/quizzes-spec.md` + `course-json-schema.md`
**Nota:** Documento histórico. El estado de la UI de quizzes y course está cubierto en `quizzes-spec.md` (sección Frontend integration) y `course-json-schema.md` (estructura de módulos).

Documento técnico del estado **actual implementado** en frontend (`apps/web`) para las secciones `/course` y `/quizzes`.

---

## 1) Marco general de layout compartido

Ambas secciones viven bajo `app/[locale]` y heredan el mismo layout base:

- `apps/web/src/app/[locale]/layout.tsx`
- Proveedores globales: `NextIntlClientProvider`, `GlobalLoaderProvider`, `AnalysisProgressProvider`, `NavigationProvider`.

Snippet:

```tsx
return (
  <NextIntlClientProvider messages={messages} locale={locale}>
    <GlobalLoaderProvider>
      <AnalysisProgressProvider>
        <NavigationProvider>
          <NavigationLoadingWrapper>{children}</NavigationLoadingWrapper>
        </NavigationProvider>
        <GlobalLoaderOverlay />
      </AnalysisProgressProvider>
    </GlobalLoaderProvider>
  </NextIntlClientProvider>
);
```

### Tokens visuales globales

Definidos en `apps/web/src/app/globals.css`:

- `.glass-header`: header oscuro institucional.
- `.glass-card`: panel/card oscuro con borde blanco tenue.
- `.quiz-no-hover`: evita hover visual en cards de sesión quiz.
- `.documentation-grid`: grilla responsive usada en landing de curso.
- `.documentation-card`: altura mínima de cards de módulos.

Snippet:

```css
.glass-card {
  background: rgba(24, 36, 49, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.glass-card:hover {
  background: rgba(28, 42, 56, 0.98);
  border-color: rgba(255, 255, 255, 0.16);
}
```

---

## 2) Estado actual UI de `course`

## 2.1 Rutas activas

Ruta -> archivo:

- `/[locale]/course` -> `apps/web/src/app/[locale]/course/page.tsx`
- `/[locale]/course/[moduleSlug]` -> `apps/web/src/app/[locale]/course/[moduleSlug]/page.tsx`
- `/[locale]/course/[moduleSlug]/[chapterSlug]` -> `apps/web/src/app/[locale]/course/[moduleSlug]/[chapterSlug]/page.tsx`

### Árbol funcional

```text
/course
  -> CourseLanding
      -> Header
      -> grid de UserGuideCard (módulos)
      -> Footer

/course/[moduleSlug]
  -> CourseModuleView
      -> Header
      -> contenido de capítulos/secciones renderizado
      -> NavigationFooter (prev/next módulo)
      -> Footer

/course/[moduleSlug]/[chapterSlug]
  -> CourseChapterView
      -> reutiliza CourseModuleView filtrando solo ese capítulo
```

---

## 2.2 Página `/course` (landing)

Archivo de página:

```tsx
export default async function CoursePage({ params }: CoursePageProps) {
  const { locale } = await params;
  const data = getCourseLandingData(locale);
  return <CourseLanding data={data} locale={locale} />;
}
```

Vista principal:

- `apps/web/src/features/course/CourseLanding.tsx`

Distribución:

- contenedor raíz: `relative flex min-h-screen flex-col`
- header institucional arriba (`<Header />`)
- `main` con paddings `p-4 sm:p-6 lg:p-8`
- ancho máximo `max-w-7xl`
- grilla de módulos con `.documentation-grid`
- footer institucional abajo (`<Footer />`)

Snippet:

```tsx
<div className="relative flex min-h-screen flex-col overflow-x-hidden">
  <Header />
  <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section className="documentation-grid">
        {data.modules.map((module) => (
          <UserGuideCard ... />
        ))}
      </section>
    </div>
  </main>
  <Footer />
</div>
```

---

## 2.3 Card de módulo (`UserGuideCard`) en `/course`

Archivo:

- `apps/web/src/components/UserGuideCard.tsx`

Qué renderiza cada card:

1. Badge superior con duración (`estimatedMinutes`).
2. Icono de módulo (`UserGuideIcon`).
3. Título y resumen del módulo.
4. Barra de progreso `%`.
5. CTA principal: `Entrar al módulo`.
6. CTA secundario quiz por módulo:
   - habilitado si `isModuleQuizEligible(progress)` (umbral 90%).
   - si habilitado: navega a `/${locale}/quizzes/session?moduleId=<id>&count=10`.
   - si bloqueado: estado no interactivo con texto de bloqueo.

Snippet (estructura de acciones):

```tsx
<NavigationLink
  href={module.route}
  className="... rounded-xl border border-primary/35 bg-primary/10 ..."
>
  {t("openModule")}
  <ArrowRight size={16} />
</NavigationLink>

{eligible ? (
  <button onClick={handleQuizClick} className="... border-emerald-400/35 ...">
    <PlayCircle size={15} />
    {t("startQuiz")}
  </button>
) : (
  <div className="... cursor-not-allowed ...">
    <Lock size={13} />
    {t("quizLocked", { threshold: 90 })}
  </div>
)}
```

---

## 2.4 Página `/course/[moduleSlug]`

Archivo de página:

```tsx
export default function CourseModulePage({ params }: CourseModulePageProps) {
  const data = getCourseModuleData(params.locale, params.moduleSlug);
  if (!data) notFound();
  return <CourseModuleView data={data} />;
}
```

Vista principal:

- `apps/web/src/features/course/CourseModuleView.tsx`

Distribución:

- `Header` + `Footer` institucional.
- `main` con `p-4 sm:p-6 lg:p-8`.
- ancho de lectura `max-w-3xl` (más estrecho que landing).
- loop por capítulos y luego por secciones.
- cada sección usa `ContentBlockRenderer` para bloques de contenido.
- al final incluye `NavigationFooter` con prev/next módulo.

Snippet del layout:

```tsx
<main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
    {data.module.chapters.map((chapter) => (
      <section key={chapter.chapterId} id={chapter.slug} className="space-y-10">
        ...
      </section>
    ))}
    <NavigationFooter ... />
  </div>
</main>
```

Comportamientos relevantes:

- tracking de progreso por sección con `useSectionCompletionTracking`.
- merge de glosario local + glosario global para auto-link de términos.

---

## 2.5 Página `/course/[moduleSlug]/[chapterSlug]`

Archivo:

- `apps/web/src/features/course/CourseChapterView.tsx`

No tiene layout propio nuevo. Reutiliza `CourseModuleView` filtrando data a un solo capítulo.

Snippet:

```tsx
const filteredData: ContentChapterData = {
  ...data,
  module: { ...data.module, chapters: [data.chapter] },
  chapters: [data.chapterSummary],
  sectionSummaries: data.sectionSummaries.filter(
    (section) => section.chapterId === data.chapter.chapterId,
  ),
};

return <CourseModuleView data={filteredData} />;
```

---

## 2.6 Estado de navegación `course`

Header global:

- `apps/web/src/components/Header.tsx`
- item de menú para curso: `href: "/course"`.
- item de quizzes: `href: "/quizzes"`.

Snippet:

```tsx
const navItems: NavItem[] = [
  ...,
  { href: "/course", labelKey: "course", icon: "school", color: "amber" },
  { href: "/quizzes", labelKey: "quizzes", icon: "quiz", color: "teal" },
  ...
];
```

---

## 3) Estado actual UI de `quizzes`

## 3.1 Rutas activas

Ruta -> archivo:

- `/[locale]/quizzes` -> `apps/web/src/app/[locale]/quizzes/page.tsx`
- `/[locale]/quizzes/session` -> `apps/web/src/app/[locale]/quizzes/session/page.tsx`

### Árbol funcional

```text
/quizzes
  -> QuizDashboardView
      -> Header
      -> Hero/card principal dashboard
      -> Grid de summary cards
      -> Panel strengths / weak areas
      -> Lista de recent attempts
      -> Empty state opcional
      -> Footer
      -> StartQuizModal (portal)

/quizzes/session
  -> parsea searchParams (moduleId/topics/skills/count/difficulty)
  -> monta QuizSessionView con props
```

---

## 3.2 Página `/quizzes` (dashboard)

Archivo de página:

```tsx
export default async function QuizzesDashboardPage({ params }: QuizzesDashboardPageProps) {
  const { locale } = await params;
  return <QuizDashboardView locale={locale} />;
}
```

Vista principal:

- `apps/web/src/features/quizzes/dashboard/QuizDashboardView.tsx`

Distribución actual:

1. Wrapper institucional igual a `course`:
   - `<Header />`
   - `<main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">`
   - `<div className="mx-auto ... max-w-7xl ...">`
   - `<Footer />`
2. Card hero `glass-card`:
   - icono emocional AALIE según `metrics.averageAccuracy`.
   - título/subtítulo.
   - botón `startNew` que abre modal.
3. Bloque `QuizSummaryCards` (4 cards).
4. Bloque strengths/weak areas (2 columnas).
5. Bloque recent attempts.
6. Estado vacío cuando `metrics.totalAttempts === 0`.
7. `StartQuizModal` montado al final.

Snippet (top-level del dashboard):

```tsx
<div className="relative flex min-h-screen flex-col overflow-x-hidden">
  <Header />
  <main className="z-10 flex-1 p-4 sm:p-6 lg:p-8">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="glass-card rounded-2xl border border-white/10 p-5 sm:p-6">
        ...
      </header>
      {isLoaded && <QuizSummaryCards metrics={metrics} />}
      ...
    </div>
  </main>
  <Footer />
  <StartQuizModal ... />
</div>
```

---

## 3.3 Componentes dashboard de quizzes

Archivo:

- `apps/web/src/features/quizzes/dashboard/QuizDashboardComponents.tsx`

### `QuizSummaryCards`

- grilla `grid-cols-2 sm:grid-cols-4`.
- cards glass:
  - total intentos.
  - accuracy promedio.
  - fortaleza principal.
  - debilidad principal.
- usa `AALIEEmotionIcon` para feedback visual del promedio.

Snippet:

```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <div className="glass-card rounded-2xl border border-white/10 p-4">...</div>
  <div className={`glass-card rounded-2xl border border-white/10 p-4 ${avgEmotion.bg}`}>...</div>
  <div className="glass-card rounded-2xl border border-white/10 p-4">...</div>
  <div className="glass-card rounded-2xl border border-white/10 p-4">...</div>
</div>
```

### `RecentAttemptsList`

- si no hay intentos: card vacía con `AALIEEmotionIcon curious`.
- si hay intentos: lista vertical (`ul`) de items `glass-card`.
- cada fila muestra:
  - icono emocional por accuracy.
  - `moduleId` o sesión general.
  - fecha local.
  - porcentaje y conteo score/correcto vs incorrecto.

---

## 3.4 Modal de inicio (`StartQuizModal`)

Archivo:

- `apps/web/src/features/quizzes/dashboard/StartQuizModal.tsx`

Infraestructura:

- usa `BaseModalContainer`.
- ancho `w-[min(95vw,560px)]`.

Secciones actuales:

1. Selector de modo: `adaptive | weak | free`.
2. Preview de weak topics (si modo weak y hay data).
3. Selector cantidad preguntas: `5/10/15/20`.
4. Footer de acciones:
   - cancelar
   - empezar (con estado loading).
5. Nota inferior de ayuda.

Snippet:

```tsx
<BaseModalContainer
  open={open}
  onClose={onClose}
  title={t("title")}
  titleIcon={<PlayCircle size={20} className="text-primary" />}
  sizeClassName="w-[min(95vw,560px)] max-h-[90vh]"
>
  ...
</BaseModalContainer>
```

---

## 3.5 Página `/quizzes/session`

Archivo:

- `apps/web/src/app/[locale]/quizzes/session/page.tsx`

Responsabilidad:

- parsear parámetros de query:
  - `moduleId`
  - `topics` / `topicIds`
  - `skills` / `skillIds`
  - `count` / `questionCount`
  - `difficulty` (`basic|intermediate|advanced`) -> `difficultyMix`.
- pasar todo como props a `QuizSessionView`.

Snippet:

```tsx
const selectedTopicIds = parseIds(sp.topics ?? sp.topicIds);
const selectedSkillIds = parseIds(sp.skills ?? sp.skillIds);

return (
  <main className="flex min-h-screen items-center justify-center bg-slate-950 px-3 py-4 sm:px-4 sm:py-8">
    <QuizSessionView
      locale={locale as Locale}
      moduleId={moduleId}
      selectedTopicIds={selectedTopicIds}
      selectedSkillIds={selectedSkillIds}
      questionCount={questionCount}
      difficultyMix={difficultyMix}
    />
  </main>
);
```

---

## 3.6 `QuizSessionView` (experiencia de sesión)

Archivo:

- `apps/web/src/features/quizzes/session/QuizSessionView.tsx`

Layout de sesión:

- card única centrada `max-w-3xl`.
- `glass-card quiz-no-hover`.
- alto mínimo `540px`, alto máximo `calc(100svh - 2rem)`.

Estados:

1. Inicial sin sesión:
   - botón `start`.
2. Error backend:
   - `QuizErrorState`.
3. Sesión sin preguntas:
   - `QuizEmptyState`.
4. Sesión activa:
   - progress bar superior.
   - `QuizQuestionCard`.
   - hint de incompleto.
   - navegación anterior/siguiente/finalizar.
5. Resultado:
   - step 0: `QuizResultView` (resumen).
   - steps siguientes: `QuizQuestionReviewCard`.
   - navegación de review + replay.

Snippet (shell principal):

```tsx
<section
  className="glass-card quiz-no-hover mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(24,36,49,0.94)] p-4 text-slate-100 sm:p-6"
  style={{ minHeight: "540px", maxHeight: "calc(100svh - 2rem)" }}
>
  <h1 className="text-center text-xl font-semibold">{t("title")}</h1>
  <p className="mt-2 text-center text-sm text-slate-300">{t("subtitle")}</p>
  ...
</section>
```

---

## 4) Capa de datos que alimenta la UI de quizzes

No es visual, pero explica qué se ve en pantalla.

## 4.1 Hook dashboard

Archivo:

- `apps/web/src/features/quizzes/dashboard/useQuizDashboard.ts`

Flujo:

1. `loadAttempts()` desde `aalie.quiz.attempts.v1`.
2. `loadQuizProgress()` desde `aalie.quiz.progress.v1`.
3. `deriveQuizDashboardMetrics(...)`.
4. set de estado `isLoaded`.

Snippet:

```tsx
useEffect(() => {
  const attempts = loadAttempts();
  const progress = loadQuizProgress();
  const metrics = deriveQuizDashboardMetrics(attempts, progress);
  setState({ metrics, progress, attempts, isLoaded: true });
}, []);
```

## 4.2 Métricas actuales derivadas

Archivo:

- `apps/web/src/features/quizzes/dashboard/deriveQuizDashboard.ts`

Métricas del dashboard hoy:

- `totalAttempts`
- `averageAccuracy`
- `recentAttempts` (slice 5)
- `topStrengths`
- `topAreasToImprove`

Reglas actuales:

- fortalezas: topics con `acc >= 0.8` y `total >= 2`.
- debilidades: topics con `acc < 0.6` y `total >= 2`.
- fallback a último intento si no hay agregados suficientes.

---

## 5) Comparativo rápido de distribución (`course` vs `quizzes`)

## 5.1 Similitudes

- Ambos usan shell institucional:
  - `Header`
  - `Footer`
  - `main` con `p-4 sm:p-6 lg:p-8`
  - ancho máximo `max-w-7xl` en landing/dashboard.
- Ambos usan patrón `glass-card`, borde `border-white/10`, radios `rounded-2xl`.
- Ambos muestran acciones primarias con estilo `border-primary/35 bg-primary/10`.

## 5.2 Diferencias actuales

- `course` landing usa **grilla de cards homogéneas** (`documentation-grid` + `documentation-card` con altura mínima fija).
- `quizzes` dashboard usa **stack vertical de bloques** (hero + grids parciales), no `documentation-grid`.
- `course` módulo/chapter usa `max-w-3xl` tipo lectura larga; `quizzes/session` también usa `max-w-3xl` tipo focus.
- `CourseSidebar` existe, pero actualmente no se monta en el flujo real de `CourseModuleView`.

---

## 6) Inventario de archivos clave (UI actual)

### Course

- `apps/web/src/app/[locale]/course/page.tsx`
- `apps/web/src/app/[locale]/course/[moduleSlug]/page.tsx`
- `apps/web/src/app/[locale]/course/[moduleSlug]/[chapterSlug]/page.tsx`
- `apps/web/src/features/course/CourseLanding.tsx`
- `apps/web/src/features/course/CourseModuleView.tsx`
- `apps/web/src/features/course/CourseChapterView.tsx`
- `apps/web/src/components/UserGuideCard.tsx`
- `apps/web/src/components/NavigationFooter.tsx`

### Quizzes

- `apps/web/src/app/[locale]/quizzes/page.tsx`
- `apps/web/src/app/[locale]/quizzes/session/page.tsx`
- `apps/web/src/features/quizzes/dashboard/QuizDashboardView.tsx`
- `apps/web/src/features/quizzes/dashboard/QuizDashboardComponents.tsx`
- `apps/web/src/features/quizzes/dashboard/StartQuizModal.tsx`
- `apps/web/src/features/quizzes/session/QuizSessionView.tsx`

### Global visual shell

- `apps/web/src/components/Header.tsx`
- `apps/web/src/components/Footer.tsx`
- `apps/web/src/app/globals.css`

