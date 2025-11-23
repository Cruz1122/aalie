# Ejemplo de Renderizado de Constantes y Ejecuciones

## Antes (Texto Plano)
```
| # | Tipo | C_k | # ejecuciones | Notas |
|---|------|-----|---------------|-------|
| 1 | for  | C_1 | (5) - (1) + 2 | Cabecera del bucle |
| 2 | assign | C_2 + C_3 | \sum_{i=1}^{5} 1 | Asignación dentro del bucle |
```

## Después (Con KaTeX)
```
| # | Tipo | C_k | # ejecuciones | Notas |
|---|------|-----|---------------|-------|
| 1 | for  | C₁  | 6            | Cabecera del bucle |
| 2 | assign | C₂ + C₃ | ∑ᵢ₌₁⁵ 1 | Asignación dentro del bucle |
```

## Beneficios del Renderizado con KaTeX

### 1. **Constantes (C_k)**
- **Antes**: `C_1`, `C_2 + C_3`
- **Después**: C₁, C₂ + C₃ (subíndices renderizados)

### 2. **Número de Ejecuciones**
- **Antes**: `(5) - (1) + 2`, `\sum_{i=1}^{5} 1`
- **Después**: 6, ∑ᵢ₌₁⁵ 1 (matemáticas renderizadas)

### 3. **Expresiones Complejas**
- **Antes**: `(n) - (1) + 2`, `\sum_{i=1}^{n} 1`
- **Después**: (n) - (1) + 2, ∑ᵢ₌₁ⁿ 1

### 4. **Sumatorias Anidadas**
- **Antes**: `\sum_{i=1}^{n} \sum_{j=1}^{i} 1`
- **Después**: ∑ᵢ₌₁ⁿ ∑ⱼ₌₁ⁱ 1

## Implementación

```tsx
<td className="p-2 whitespace-nowrap text-slate-200">
  <Formula latex={row.ck} />
</td>
<td className="p-2 whitespace-nowrap text-slate-200">
  <Formula latex={row.count} />
</td>
```

## Casos de Uso

### Algoritmos Básicos
```
procedure basic()
  x = 5          // C₁, 1
  y = x + 1      // C₂ + C₃, 1
  return y       // C₄, 1
end procedure
```

### Algoritmos Iterativos
```
procedure sum(n)
  s = 0                    // C₁, 1
  for i = 1 to n do        // C₂, n+1
    s = s + i              // C₃ + C₄, ∑ᵢ₌₁ⁿ 1
  end for
  return s                 // C₅, 1
end procedure
```

### Bucles Anidados
```
procedure matrixSum(A, n)
  sum = 0                  // C₁, 1
  for i = 1 to n do        // C₂, n+1
    for j = 1 to n do      // C₃, ∑ᵢ₌₁ⁿ (n+1)
      sum = sum + A[i,j]   // C₄ + C₅, ∑ᵢ₌₁ⁿ ∑ⱼ₌₁ⁿ 1
    end for
  end for
  return sum               // C₆, 1
end procedure
```
