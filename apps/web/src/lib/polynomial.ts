/**
 * Utilidades para manejo de polinomios y notación asintótica
 */

/**
 * Calcula la notación asintótica Big-O a partir de una expresión polinómica
 */
export function calculateBigO(polynomial: string): string {
  if (!polynomial) return 'O(1)';
  
  const normalized = polynomial.trim();
  
  if (normalized.includes('n^3') || normalized.includes('n³')) return 'O(n^3)';
  if (normalized.includes('n^2') || normalized.includes('n²')) return 'O(n^2)';
  
  // Verificar si hay 'n' que no sea parte de n^2, n^3, etc.
  const linearPatternStr = String.raw`(^|[^\^])n(?![\w^])`;
  const linearPattern = new RegExp(linearPatternStr);
  if (linearPattern.test(normalized)) return 'O(n)';
  
  const logPatternStr = String.raw`\\log\(n\)|log\(n\)`;
  if (new RegExp(logPatternStr).test(normalized)) return String.raw`O(\log n)`;
  
  return 'O(1)';
}

/**
 * Normaliza un polinomio eliminando términos con coeficiente 0
 */
export function normalizePolynomial(poly?: string): string {
  if (!poly) return '';
  
  // Reemplazar \cdot por espacio y limpiar espacios
  let normalized = poly.replaceAll(/\\cdot/g, ' ').replaceAll(/\s+/g, ' ').trim();
  
  // Separar por + y filtrar términos con "0 *"
  const parts = normalized.split('+').map(s => s.trim()).filter(term => !/^0\s/.test(term));
  
  // Volver a unir
  return parts.join(' + ') || '0';
}

/**
 * Obtiene el caso seleccionado desde sessionStorage
 */
export function getSavedCase(): 'worst' | 'average' | 'best' {
  if (typeof globalThis.window === 'undefined') return 'worst';
  
  const saved = globalThis.window.sessionStorage.getItem('analyzerSelectedCase');
  if (saved === 'best' || saved === 'average' || saved === 'worst') return saved;
  
  return 'worst';
}

/**
 * Guarda el caso seleccionado en sessionStorage
 */
export function saveCase(caseType: 'worst' | 'average' | 'best'): void {
  if (typeof globalThis.window !== 'undefined') {
    globalThis.window.sessionStorage.setItem('analyzerSelectedCase', caseType);
  }
}

