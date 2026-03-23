/**
 * Textos para el análisis GPU vs CPU.
 * Permite generar summary, explanation y recommendation en el idioma del usuario.
 */
export const GPU_CPU_TEXTS = {
  en: {
    summary: {
      gpu: "Due to the number of loops and the little conditional logic within them, this algorithm presents a fairly regular and repetitive execution pattern, typical of tasks that can be parallelized over large amounts of data.",
      cpu: "This algorithm combines recursion and decisions within loops, which produces a more irregular control flow and tends to fit better on a CPU.",
      mixed: "The algorithm structure is intermediate: it has loops and some recursion or branching, so it could benefit from both a good CPU and some degree of parallelism, depending on the implementation.",
    },
    explanation: {
      loopsDetected: (n: number) => `• ${n} loop${n !== 1 ? "s" : ""} detected in total`,
      depthNested: (d: number) =>
        d === 2
          ? `• Maximum nesting depth is ${d}, indicating a nested loop structure`
          : `• Maximum nesting depth is ${d}, indicating a deeply nested structure`,
      loopsNotNested: "• Loops are not nested (maximum depth: 1)",
      conditionalsHigh: (c: number, r: string) =>
        `• ${c} conditional${c !== 1 ? "s" : ""} found within loops (ratio: ${r}%), indicating a high level of decisions during execution`,
      conditionalsModerate: (c: number, r: string) =>
        `• ${c} conditional${c !== 1 ? "s" : ""} found within loops (ratio: ${r}%), with a moderate level of decisions`,
      conditionalsLow: (c: number, r: string) =>
        `• ${c} conditional${c !== 1 ? "s" : ""} found within loops (ratio: ${r}%), indicating loops with relatively simple logic`,
      noConditionals:
        "• No conditionals detected within loops, suggesting a very regular execution pattern",
      noLoops: "• No loops detected in the algorithm",
      recursiveOne: "• The algorithm is recursive with one recursive call detected, indicating a self-call pattern",
      recursiveMany: (n: number) => `• The algorithm is recursive with ${n} recursive calls detected, suggesting a complex recursive pattern`,
      recursiveUnknown:
        "• The algorithm presents recursion, although not all recursive calls could be counted",
      noRecursion: "• No recursion detected in the algorithm, indicating an iterative execution pattern",
      arrayIntensive: (n: number) =>
        `• ${n} access${n !== 1 ? "es" : ""} to indexed structures detected, indicating intensive block data processing`,
      arrayMultiple: (n: number) =>
        `• ${n} access${n !== 1 ? "es" : ""} to indexed structures detected, with multiple accesses per iteration`,
      arrayDetected: (n: number) => `• ${n} access${n !== 1 ? "es" : ""} to indexed structures detected`,
      noArrayAccess: "• No accesses to indexed structures (arrays or lists) detected",
      callsHigh: (n: number) =>
        `• ${n} function call${n !== 1 ? "s" : ""} within loops, which can introduce significant overhead`,
      callsDetected: (n: number) =>
        `• ${n} function call${n !== 1 ? "s" : ""} within loops`,
    },
    recommendations: {
      gpu: [
        "Recommendation: if you need to scale to large volumes of data, this algorithm is a good candidate for a GPU-based implementation or vectorized libraries, as its computation pattern is quite uniform. It may work well on CPU, but the greatest potential for improvement usually lies in massive parallelism.",
        "Recommendation: the regular loop structure and little conditional logic make this algorithm an excellent candidate for massive parallelization. Consider using frameworks like CUDA, OpenCL or vectorized libraries (NumPy, TensorFlow) to fully leverage GPU hardware.",
        "Recommendation: this algorithm presents ideal characteristics for GPU: regular loops, block data processing and little control divergence. If you work with large volumes of data, a GPU implementation can offer significant performance improvements.",
        "Recommendation: the uniform and repetitive execution pattern of this algorithm benefits greatly from the massive parallelism offered by GPUs. For small datasets, a CPU may be sufficient, but to scale, consider migrating to GPU or using vectorized processing.",
        "Recommendation: the regular and predictable nature of the loops in this algorithm makes it ideal for GPU kernels. Parallel processing can significantly accelerate execution, especially when working with large arrays or multiple iterations over the same data.",
      ],
      cpu: [
        "Recommendation: this algorithm tends to perform better on a CPU, due to its recursion and/or the number of decisions in the loops. If performance is an issue, it is usually more effective to improve the algorithm complexity, case pruning or CPU implementation before attempting to move it to GPU.",
        "Recommendation: the presence of recursion and multiple conditional decisions makes this algorithm more suitable for CPUs, where irregular control flow is handled more efficiently. Focus on optimizing algorithmic complexity and using techniques like memoization or pruning before considering GPU.",
        "Recommendation: the irregular control flow and recursion in this algorithm hinder its effective parallelization on GPU. A modern multi-core CPU is usually the best option. Consider optimizations such as data structure improvements or more efficient algorithms.",
        "Recommendation: due to the recursive nature and frequent decisions within loops, this algorithm runs better on CPU. GPUs are not ideal for this type of pattern due to control divergence. Improve the algorithm or use CPU-specific optimization techniques.",
        "Recommendation: the combination of recursion and intense branching makes this algorithm a poor candidate for GPU. Data transfer overhead and control divergence would negate any benefit. Optimize on CPU using techniques like cache, memoization or more efficient algorithms.",
        "Recommendation: this algorithm presents a complex control flow that benefits more from the flexibility of a CPU. Recursion and frequent conditional decisions hinder effective parallelization. Focus on improving algorithmic complexity or using CPU-specific optimizations.",
      ],
      mixed: [
        "Recommendation: a multicore CPU is usually sufficient in most scenarios. If you are interested in a GPU version later, the most reasonable approach would be to extract the most regular parts of the algorithm (simple loops over data) and convert only those sections into parallel kernels.",
        "Recommendation: this algorithm has characteristics of both GPU and CPU. For most cases, a multicore CPU is the most practical option. If you need more performance, consider a hybrid approach: process regular parts on GPU and recursive/conditional parts on CPU.",
        "Recommendation: the mixed structure of this algorithm suggests that a modern multicore CPU is the best initial option. If more later you need performance, identify the most regular sections (simple loops) and consider parallelizing them, keeping complex logic on CPU.",
        "Recommendation: since this algorithm combines regular and irregular patterns, a multicore CPU offers the best balance. For future optimizations, you could separate parallelizable parts (regular loops) and run them on GPU, while keeping complex logic on CPU.",
        "Recommendation: this algorithm presents an intermediate structure that benefits best from a CPU with good thread-level parallelism. If you need more performance, consider optimizing the most regular parts of the code or using a hybrid CPU-GPU approach for specific sections.",
      ],
    },
  },
  es: {
    summary: {
      gpu: "Por la cantidad de bucles y la poca lógica condicional dentro de los mismos, este algoritmo presenta un patrón de ejecución bastante regular y repetitivo, típico de tareas que se pueden paralelizar sobre muchos datos.",
      cpu: "Este algoritmo combina recursión y decisiones dentro de los bucles, lo que produce un flujo de control más irregular y suele ajustarse mejor a una CPU.",
      mixed: "La estructura del algoritmo es intermedia: tiene bucles y algo de recursión o branching, por lo que podría beneficiarse tanto de una buena CPU como de cierto grado de paralelismo, según la implementación.",
    },
    explanation: {
      loopsDetected: (n: number) => `• Se detectaron ${n} bucle${n !== 1 ? "s" : ""} en total`,
      depthNested: (d: number) =>
        d === 2
          ? `• La profundidad máxima de anidación es ${d}, lo que indica una estructura de bucles anidados`
          : `• La profundidad máxima de anidación es ${d}, lo que indica una estructura profundamente anidada`,
      loopsNotNested: "• Los bucles no están anidados (profundidad máxima: 1)",
      conditionalsHigh: (c: number, r: string) =>
        `• Se encontraron ${c} condicional${c !== 1 ? "es" : ""} dentro de los bucles (ratio: ${r}%), indicando un alto nivel de decisiones durante la ejecución`,
      conditionalsModerate: (c: number, r: string) =>
        `• Se encontraron ${c} condicional${c !== 1 ? "es" : ""} dentro de los bucles (ratio: ${r}%), con un nivel moderado de decisiones`,
      conditionalsLow: (c: number, r: string) =>
        `• Se encontraron ${c} condicional${c !== 1 ? "es" : ""} dentro de los bucles (ratio: ${r}%), indicando bucles con lógica relativamente simple`,
      noConditionals:
        "• No se detectaron condicionales dentro de los bucles, lo que sugiere un patrón de ejecución muy regular",
      noLoops: "• No se detectaron bucles en el algoritmo",
      recursiveOne:
        "• El algoritmo es recursivo con una llamada recursiva detectada, lo que indica un patrón de auto-llamadas",
      recursiveMany: (n: number) =>
        `• El algoritmo es recursivo con ${n} llamadas recursivas detectadas, sugiriendo un patrón recursivo complejo`,
      recursiveUnknown:
        "• El algoritmo presenta recursión, aunque no se pudieron contar todas las llamadas recursivas",
      noRecursion:
        "• No se detectó recursión en el algoritmo, lo que indica un patrón de ejecución iterativo",
      arrayIntensive: (n: number) =>
        `• Se detectaron ${n} acceso${n !== 1 ? "s" : ""} a estructuras indexadas, lo que indica un procesamiento intensivo de datos en bloque`,
      arrayMultiple: (n: number) =>
        `• Se detectaron ${n} acceso${n !== 1 ? "s" : ""} a estructuras indexadas, con múltiples accesos por iteración`,
      arrayDetected: (n: number) =>
        `• Se detectaron ${n} acceso${n !== 1 ? "s" : ""} a estructuras indexadas`,
      noArrayAccess: "• No se detectaron accesos a estructuras indexadas (arrays o listas)",
      callsHigh: (n: number) =>
        `• Se realizan ${n} llamada${n !== 1 ? "s" : ""} a funciones dentro de los bucles, lo que puede introducir overhead significativo`,
      callsDetected: (n: number) =>
        `• Se realizan ${n} llamada${n !== 1 ? "s" : ""} a funciones dentro de los bucles`,
    },
    recommendations: {
      gpu: [
        "Recomendación: si necesitas escalar a volúmenes grandes de datos, este algoritmo es un buen candidato para una implementación basada en GPU o en librerías vectorizadas, ya que su patrón de cálculo es bastante uniforme. En CPU puede funcionar bien, pero el mayor potencial de mejora suele estar en el paralelismo masivo.",
        "Recomendación: la estructura regular de bucles y la poca lógica condicional hacen de este algoritmo un excelente candidato para paralelización masiva. Considera usar frameworks como CUDA, OpenCL o librerías vectorizadas (NumPy, TensorFlow) para aprovechar al máximo el hardware GPU.",
        "Recomendación: este algoritmo presenta características ideales para GPU: bucles regulares, procesamiento de datos en bloque y poca divergencia de control. Si trabajas con grandes volúmenes de datos, una implementación en GPU puede ofrecer mejoras significativas de rendimiento.",
        "Recomendación: el patrón de ejecución uniforme y repetitivo de este algoritmo se beneficia enormemente del paralelismo masivo que ofrecen las GPUs. Para datasets pequeños, una CPU puede ser suficiente, pero para escalar, considera migrar a GPU o usar procesamiento vectorizado.",
        "Recomendación: la naturaleza regular y predecible de los bucles en este algoritmo lo hace ideal para kernels de GPU. El procesamiento paralelo puede acelerar significativamente la ejecución, especialmente cuando se trabaja con arrays grandes o múltiples iteraciones sobre los mismos datos.",
      ],
      cpu: [
        "Recomendación: este algoritmo tiende a aprovechar mejor una CPU, debido a su recursión y/o a la cantidad de decisiones en los bucles. Si el rendimiento es un problema, suele ser más efectivo mejorar la complejidad del algoritmo, la poda de casos o la implementación en CPU, antes que intentar llevarlo a GPU.",
        "Recomendación: la presencia de recursión y múltiples decisiones condicionales hace que este algoritmo sea más adecuado para CPUs, donde el flujo de control irregular se maneja de forma más eficiente. Enfócate en optimizar la complejidad algorítmica y usar técnicas como memoización o poda antes que considerar GPU.",
        "Recomendación: el flujo de control irregular y la recursión en este algoritmo dificultan su paralelización efectiva en GPU. Una CPU moderna con múltiples núcleos suele ser la mejor opción. Considera optimizaciones como mejoras en la estructura de datos o algoritmos más eficientes.",
        "Recomendación: debido a la naturaleza recursiva y las decisiones frecuentes dentro de los bucles, este algoritmo se ejecuta mejor en CPU. Las GPUs no son ideales para este tipo de patrones debido a la divergencia de control. Mejora el algoritmo o usa técnicas de optimización en CPU.",
        "Recomendación: la combinación de recursión y branching intenso hace que este algoritmo sea un mal candidato para GPU. El overhead de transferencia de datos y la divergencia de control anularían cualquier beneficio. Optimiza en CPU usando técnicas como caché, memoización o algoritmos más eficientes.",
        "Recomendación: este algoritmo presenta un flujo de control complejo que se beneficia más de la flexibilidad de una CPU. La recursión y las decisiones condicionales frecuentes dificultan la paralelización efectiva. Enfócate en mejorar la complejidad algorítmica o usar optimizaciones específicas de CPU.",
      ],
      mixed: [
        "Recomendación: una CPU multicore suele ser suficiente en la mayoría de escenarios. Si más adelante te interesa una versión en GPU, lo más razonable sería extraer las partes más regulares del algoritmo (bucles simples sobre datos) y convertir solo esas secciones en kernels paralelos.",
        "Recomendación: este algoritmo tiene características tanto de GPU como de CPU. Para la mayoría de casos, una CPU multicore es la opción más práctica. Si necesitas más rendimiento, considera un enfoque híbrido: procesar las partes regulares en GPU y las recursivas/condicionales en CPU.",
        "Recomendación: la estructura mixta de este algoritmo sugiere que una CPU moderna con múltiples núcleos es la mejor opción inicial. Si más adelante necesitas más rendimiento, identifica las secciones más regulares (bucles simples) y considera paralelizarlas, manteniendo la lógica compleja en CPU.",
        "Recomendación: dado que este algoritmo combina patrones regulares e irregulares, una CPU multicore ofrece el mejor equilibrio. Para optimizaciones futuras, podrías separar las partes paralelizables (bucles regulares) y ejecutarlas en GPU, mientras mantienes la lógica compleja en CPU.",
        "Recomendación: este algoritmo presenta una estructura intermedia que se beneficia mejor de una CPU con buen paralelismo a nivel de hilos. Si necesitas más rendimiento, considera optimizar las partes más regulares del código o usar un enfoque híbrido CPU-GPU para secciones específicas.",
      ],
    },
  },
} as const;

export type GpuCpuLocale = keyof typeof GPU_CPU_TEXTS;

