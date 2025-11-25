/**
 * Generador del árbol de recursión para visualización con react-flow.
 * Soporta dos tipos:
 * 1. Divide-and-conquer (uniforme, niveles regulares)
 * 2. Linear shift (irregular, crecimiento exponencial, ej: Fibonacci)
 *
 * Author: Juan Camilo Cruz Parra (@Cruz1122)
 */

/**
 * Datos de recurrencia para algoritmos divide-and-conquer.
 */
export interface RecurrenceData {
  a: number; // número de subproblemas
  b: number; // factor de reducción
  f: string; // trabajo no recursivo f(n)
  n0: number; // caso base
}

/**
 * Datos de recurrencia para algoritmos con desplazamiento lineal.
 */
export interface LinearRecurrenceData {
  shifts: number[]; // desplazamientos [1, 2] para Fibonacci
  coefficients: number[]; // coeficientes [1, 1] para Fibonacci
  g_n?: string; // término no homogéneo g(n), null si es homogénea
  n0: number; // caso base
}

export interface TreeNode {
  id: string;
  label: string;
  size: number; // tamaño del subproblema (n, n/b, n/b², etc.)
  level: number; // nivel en el árbol (0 = raíz)
  nodeCount: number; // número de nodos en este nivel
  isBaseCase: boolean; // si es caso base
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface TreeLayout {
  nodes: Array<{
    id: string;
    type?: string;
    data: {
      label: string;
      size: number;
      level: number;
      nodeCount: number;
      isBaseCase: boolean;
    };
    position: { x: number; y: number };
  }>;
  edges: TreeEdge[];
  metadata: {
    totalNodes: number;
    totalLevels: number;
    nodesPerLevel: number[];
  };
}

/**
 * Calcula la profundidad máxima hasta el caso base.
 * @param recurrence - Datos de la recurrencia divide-and-conquer
 * @param initialN - Valor inicial de n (por defecto 30)
 * @returns Profundidad máxima hasta llegar al caso base
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
function calculateBaseCaseDepth(
  recurrence: RecurrenceData,
  initialN: number = 30,
): number {
  let depth = 0;
  let currentN = initialN;

  while (currentN > recurrence.n0 && recurrence.b > 1) {
    currentN = currentN / recurrence.b;
    depth++;
  }

  return depth;
}

/**
 * Genera todos los nodos del árbol de recursión.
 * @param recurrence - Datos de la recurrencia divide-and-conquer
 * @param maxDepth - Profundidad máxima del árbol (null para calcular automáticamente)
 * @param initialN - Valor inicial de n (por defecto 30)
 * @returns Array de nodos del árbol
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
function generateTreeNodes(
  recurrence: RecurrenceData,
  maxDepth: number | null,
  initialN: number = 30,
): TreeNode[] {
  const nodes: TreeNode[] = [];
  const baseCaseDepth = calculateBaseCaseDepth(recurrence, initialN);
  const effectiveMaxDepth =
    maxDepth !== null ? Math.min(maxDepth, baseCaseDepth) : baseCaseDepth;

  // Nodo raíz
  nodes.push({
    id: "root",
    label: "T(n)",
    size: initialN,
    level: 0,
    nodeCount: 1,
    isBaseCase: false,
  });

  // Generar niveles sucesivos
  for (let level = 1; level <= effectiveMaxDepth; level++) {
    const nodesInLevel = Math.pow(recurrence.a, level);
    const sizeAtLevel = initialN / Math.pow(recurrence.b, level);
    const isBaseCase = sizeAtLevel <= recurrence.n0;

    for (let i = 0; i < nodesInLevel; i++) {
      const nodeId = `node-${level}-${i}`;
      nodes.push({
        id: nodeId,
        label: `T(${sizeAtLevel.toFixed(1)})`,
        size: sizeAtLevel,
        level,
        nodeCount: nodesInLevel,
        isBaseCase,
      });
    }

    // Si llegamos al caso base, detener
    if (isBaseCase) {
      break;
    }
  }

  return nodes;
}

/**
 * Genera las aristas (edges) del árbol con información del costo.
 * @param nodes - Array de nodos del árbol
 * @param recurrence - Datos de la recurrencia divide-and-conquer
 * @returns Array de aristas del árbol
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
function generateTreeEdges(
  nodes: TreeNode[],
  recurrence: RecurrenceData,
): TreeEdge[] {
  const edges: TreeEdge[] = [];

  // Crear un mapa de nodos por ID y por nivel-índice para búsqueda rápida
  const nodeMap = new Map<string, TreeNode>();
  const nodesByLevel = new Map<number, TreeNode[]>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  }

  // Ordenar nodos por nivel y por índice dentro de cada nivel
  for (const levelNodes of nodesByLevel.values()) {
    levelNodes.sort((a, b) => {
      const aIndex = parseInt(a.id.split("-").pop() || "0");
      const bIndex = parseInt(b.id.split("-").pop() || "0");
      return aIndex - bIndex;
    });
  }

  // Para cada nodo que no sea raíz, encontrar su padre
  for (const node of nodes) {
    if (node.level === 0) continue;

    // Extraer el índice del nodo (último número del ID)
    const idParts = node.id.split("-");
    const nodeIndex = parseInt(idParts[idParts.length - 1] || "0");

    // El índice del padre en su nivel
    const parentLevel = node.level - 1;
    const parentIndex = Math.floor(nodeIndex / recurrence.a);

    // Determinar el ID del padre
    let parentId: string;
    if (parentLevel === 0) {
      parentId = "root";
    } else {
      // Buscar el nodo padre en el nivel correspondiente
      const parentLevelNodes = nodesByLevel.get(parentLevel);
      if (!parentLevelNodes || parentLevelNodes.length <= parentIndex) {
        console.warn(
          `[generateTreeEdges] Parent at level ${parentLevel}, index ${parentIndex} not found for node ${node.id}`,
        );
        continue;
      }
      parentId = parentLevelNodes[parentIndex].id;
    }

    // Verificar que el padre existe
    if (!nodeMap.has(parentId)) {
      console.warn(
        `[generateTreeEdges] Parent node ${parentId} not found for node ${node.id} (level ${node.level}, index ${nodeIndex})`,
      );
      continue;
    }

    edges.push({
      id: `edge-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      style: {
        stroke: "#64748b",
        strokeWidth: 2,
      },
    });
  }

  return edges;
}

/**
 * Calcula posiciones de nodos para layout vertical (arriba-abajo)
 */
function calculateVerticalPositions(
  nodes: TreeNode[],
  recurrence: RecurrenceData,
  _nodeWidth: number = 180,
  _nodeHeight: number = 80,
  horizontalSpacing: number = 250,
  verticalSpacing: number = 150,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Agrupar nodos por nivel
  const nodesByLevel = new Map<number, TreeNode[]>();
  for (const node of nodes) {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  }

  // Calcular posiciones
  for (const [level, levelNodes] of nodesByLevel.entries()) {
    const y = level * verticalSpacing;
    const nodesInLevel = levelNodes.length;

    // Centrar los nodos horizontalmente
    const totalWidth = (nodesInLevel - 1) * horizontalSpacing;
    const startX = -totalWidth / 2;

    levelNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: startX + index * horizontalSpacing,
        y,
      });
    });
  }

  return positions;
}

/**
 * Calcula posiciones de nodos para layout horizontal (izquierda-derecha)
 */
function calculateHorizontalPositions(
  nodes: TreeNode[],
  recurrence: RecurrenceData,
  _nodeWidth: number = 180,
  _nodeHeight: number = 80,
  horizontalSpacing: number = 250,
  verticalSpacing: number = 150,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Agrupar nodos por nivel
  const nodesByLevel = new Map<number, TreeNode[]>();
  for (const node of nodes) {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  }

  // Calcular posiciones (intercambiar x e y)
  for (const [level, levelNodes] of nodesByLevel.entries()) {
    const x = level * horizontalSpacing;
    const nodesInLevel = levelNodes.length;

    // Centrar los nodos verticalmente
    const totalHeight = (nodesInLevel - 1) * verticalSpacing;
    const startY = -totalHeight / 2;

    levelNodes.forEach((node, index) => {
      positions.set(node.id, {
        x,
        y: startY + index * verticalSpacing,
      });
    });
  }

  return positions;
}

/**
 * Genera el árbol completo de recursión con layout
 */
export function generateRecursionTree(
  recurrence: RecurrenceData,
  maxDepth: number | null = null,
  orientation: "vertical" | "horizontal" = "vertical",
  initialN: number = 30,
): TreeLayout {
  // Validaciones básicas
  if (recurrence.a <= 0 || recurrence.b <= 1) {
    throw new Error(
      "Parámetros de recurrencia inválidos: a debe ser > 0 y b debe ser > 1",
    );
  }

  // Generar nodos y edges
  const treeNodes = generateTreeNodes(recurrence, maxDepth, initialN);
  const treeEdges = generateTreeEdges(treeNodes, recurrence);

  // Calcular posiciones según orientación
  const positionMap =
    orientation === "vertical"
      ? calculateVerticalPositions(treeNodes, recurrence)
      : calculateHorizontalPositions(treeNodes, recurrence);

  // Convertir a formato de react-flow
  // Nota: sourcePosition y targetPosition se pasarán como strings y se convertirán en Position en el componente
  const sourcePos = orientation === "vertical" ? "bottom" : "right";
  const targetPos = orientation === "vertical" ? "top" : "left";

  const nodes = treeNodes.map((node) => ({
    id: node.id,
    type: "default",
    data: {
      label: node.label,
      size: node.size,
      level: node.level,
      nodeCount: node.nodeCount,
      isBaseCase: node.isBaseCase,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    },
    position: positionMap.get(node.id) || { x: 0, y: 0 },
  }));

  // Calcular metadatos
  const nodesPerLevel = new Map<number, number>();
  for (const node of treeNodes) {
    nodesPerLevel.set(node.level, (nodesPerLevel.get(node.level) || 0) + 1);
  }

  const metadata = {
    totalNodes: treeNodes.length,
    totalLevels: Math.max(...treeNodes.map((n) => n.level)) + 1,
    nodesPerLevel: Array.from(nodesPerLevel.values()),
  };

  return {
    nodes,
    edges: treeEdges,
    metadata,
  };
}

/**
 * Interfaz para nodos de árbol lineal (recurrencias por desplazamiento)
 */
export interface LinearTreeNode {
  id: string;
  label: string; // T(n), T(n-1), T(n-2), etc.
  argument: number; // valor del argumento (n, n-1, n-2, etc.)
  level: number; // nivel en el árbol (0 = raíz)
  isBaseCase: boolean; // si es caso base
  duplicateCount?: number; // número de veces que aparece este subproblema
  parentId?: string; // ID del nodo padre (para múltiples padres)
}

/**
 * Genera nodos del árbol para recurrencias lineales (irregulares)
 * Para Fibonacci: T(n) -> T(n-1), T(n-2)
 */
function generateLinearTreeNodes(
  recurrence: LinearRecurrenceData,
  maxDepth: number | null,
  initialN: number = 10,
): LinearTreeNode[] {
  const nodes: LinearTreeNode[] = [];
  const nodeMap = new Map<number, LinearTreeNode[]>(); // argument -> nodes[]
  const visited = new Set<string>(); // para evitar duplicados de ID

  // Función auxiliar para calcular número de Fibonacci (aproximación)
  // const fibCount = (k: number): number => {
  //   if (k <= 1) return 1;
  //   const phi = (1 + Math.sqrt(5)) / 2;
  //   return Math.round(Math.pow(phi, k) / Math.sqrt(5));
  // };

  // Cola para procesar nodos (BFS)
  interface QueueItem {
    argument: number;
    level: number;
    parentId: string | null;
    childIndex: number;
  }

  const queue: QueueItem[] = [
    { argument: initialN, level: 0, parentId: null, childIndex: 0 },
  ];

  const effectiveMaxDepth = maxDepth !== null ? maxDepth : initialN;

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Verificar límites
    if (current.level > effectiveMaxDepth) continue;
    if (current.argument <= recurrence.n0) {
      // Es caso base
      const baseCaseId = current.parentId
        ? `${current.parentId}-child-${current.childIndex}`
        : "root-base";

      if (!visited.has(baseCaseId)) {
        nodes.push({
          id: baseCaseId,
          label: `T(${Math.max(0, current.argument)})`,
          argument: Math.max(0, current.argument),
          level: current.level,
          isBaseCase: true,
          parentId: current.parentId || undefined,
        });
        visited.add(baseCaseId);
      }
      continue;
    }

    // Generar ID único para este nodo
    const nodeId = current.parentId
      ? `${current.parentId}-child-${current.childIndex}`
      : "root";

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    // Crear nodo
    const node: LinearTreeNode = {
      id: nodeId,
      label: `T(${current.argument})`,
      argument: current.argument,
      level: current.level,
      isBaseCase: false,
      parentId: current.parentId || undefined,
    };

    nodes.push(node);

    // Guardar en mapa por argumento para contar duplicados
    if (!nodeMap.has(current.argument)) {
      nodeMap.set(current.argument, []);
    }
    nodeMap.get(current.argument)!.push(node);

    // Generar hijos según los desplazamientos
    // Para Fibonacci: shifts=[1,2], entonces T(n) -> T(n-1), T(n-2)
    for (let i = 0; i < recurrence.shifts.length; i++) {
      const shift = recurrence.shifts[i];
      const childArgument = current.argument - shift;

      if (childArgument >= 0) {
        queue.push({
          argument: childArgument,
          level: current.level + 1,
          parentId: nodeId,
          childIndex: i,
        });
      }
    }
  }

  // Calcular conteo de duplicados
  for (const [, argNodes] of nodeMap.entries()) {
    if (argNodes.length > 1) {
      // Múltiples nodos con el mismo argumento = subproblema duplicado
      for (const node of argNodes) {
        node.duplicateCount = argNodes.length;
      }
    }
  }

  return nodes;
}

/**
 * Genera edges para árbol lineal (irregular)
 */
function generateLinearTreeEdges(nodes: LinearTreeNode[]): TreeEdge[] {
  const edges: TreeEdge[] = [];
  const nodeMap = new Map<string, LinearTreeNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Para cada nodo que no sea raíz, crear edge desde su padre
  for (const node of nodes) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      edges.push({
        id: `edge-${node.parentId}-${node.id}`,
        source: node.parentId,
        target: node.id,
        style: {
          stroke: "#64748b",
          strokeWidth: 2,
        },
      });
    }
  }

  return edges;
}

/**
 * Calcula posiciones para árbol lineal (irregular, layout tipo árbol binario expandido)
 */
function calculateLinearTreePositions(
  nodes: LinearTreeNode[],
  initialN: number,
  orientation: "vertical" | "horizontal" = "vertical",
  _nodeWidth: number = 160,
  _nodeHeight: number = 90,
  horizontalSpacing: number = 200,
  verticalSpacing: number = 150,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeMap = new Map<string, LinearTreeNode>();
  const childrenMap = new Map<string, LinearTreeNode[]>();

  // Construir mapas
  for (const node of nodes) {
    nodeMap.set(node.id, node);
    if (node.parentId) {
      if (!childrenMap.has(node.parentId)) {
        childrenMap.set(node.parentId, []);
      }
      childrenMap.get(node.parentId)!.push(node);
    }
  }

  // Calcular posiciones recursivamente usando DFS
  function calculatePosition(
    nodeId: string,
    level: number,
    xOffset: number,
    width: number,
  ): { x: number; y: number; usedWidth: number } {
    const node = nodeMap.get(nodeId);
    if (!node) return { x: 0, y: 0, usedWidth: 0 };

    const children = childrenMap.get(nodeId) || [];
    const childrenCount = children.length;

    let y: number;
    let x: number;

    if (orientation === "vertical") {
      y = level * verticalSpacing;
      // Si no tiene hijos, está en el centro de su espacio asignado
      if (childrenCount === 0) {
        x = xOffset + width / 2;
        return { x, y, usedWidth: width };
      }

      // Distribuir hijos horizontalmente
      const childWidth = width / childrenCount;
      let currentX = xOffset;
      let maxUsedWidth = 0;

      // Calcular posiciones de hijos primero
      const childPositions: Array<{ x: number; y: number; usedWidth: number }> =
        [];
      for (const child of children) {
        const childPos = calculatePosition(
          child.id,
          level + 1,
          currentX,
          childWidth,
        );
        childPositions.push(childPos);
        currentX += childPos.usedWidth;
        maxUsedWidth = Math.max(maxUsedWidth, childPos.usedWidth);
      }

      // Posicionar nodo actual en el centro de sus hijos
      const childrenStartX = childPositions[0]?.x || xOffset;
      const childrenEndX =
        childPositions[childPositions.length - 1]?.x || xOffset + width;
      x = (childrenStartX + childrenEndX) / 2;

      return { x, y, usedWidth: width };
    } else {
      // Horizontal layout
      x = level * horizontalSpacing;
      if (childrenCount === 0) {
        y = xOffset + width / 2;
        return { x, y, usedWidth: width };
      }

      const childWidth = width / childrenCount;
      let currentY = xOffset;
      let maxUsedWidth = 0;

      const childPositions: Array<{ x: number; y: number; usedWidth: number }> =
        [];
      for (const child of children) {
        const childPos = calculatePosition(
          child.id,
          level + 1,
          currentY,
          childWidth,
        );
        childPositions.push(childPos);
        currentY += childPos.usedWidth;
        maxUsedWidth = Math.max(maxUsedWidth, childPos.usedWidth);
      }

      const childrenStartY = childPositions[0]?.y || xOffset;
      const childrenEndY =
        childPositions[childPositions.length - 1]?.y || xOffset + width;
      y = (childrenStartY + childrenEndY) / 2;

      return { x, y, usedWidth: width };
    }
  }

  // Encontrar raíz
  const root = nodes.find((n) => !n.parentId) || nodes[0];
  if (!root) return positions;

  // Calcular ancho inicial aproximado basado en la profundidad máxima
  const maxLevel = Math.max(...nodes.map((n) => n.level));
  const estimatedWidth = Math.pow(2, maxLevel) * horizontalSpacing * 2;

  // Calcular todas las posiciones
  const visited = new Set<string>();
  function setPosition(
    nodeId: string,
    level: number,
    xOffset: number,
    width: number,
  ) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const pos = calculatePosition(nodeId, level, xOffset, width);
    positions.set(nodeId, { x: pos.x, y: pos.y });

    const node = nodeMap.get(nodeId);
    if (!node) return;

    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) return;

    const childWidth = width / children.length;
    let currentOffset = xOffset;

    for (const child of children) {
      if (orientation === "vertical") {
        setPosition(child.id, level + 1, currentOffset, childWidth);
      } else {
        setPosition(child.id, level + 1, currentOffset, childWidth);
      }
      currentOffset += childWidth;
    }
  }

  setPosition(root.id, 0, -estimatedWidth / 2, estimatedWidth);

  return positions;
}

/**
 * Genera el árbol de recursión para recurrencias lineales (irregulares)
 * Ejemplo: Fibonacci T(n) = T(n-1) + T(n-2)
 */
/**
 * Genera el layout completo del árbol de recursión para algoritmos con recurrencia lineal.
 * Útil para visualizar recurrencias como Fibonacci (T(n) = T(n-1) + T(n-2)).
 *
 * @param recurrence - Datos de la recurrencia lineal
 * @param maxDepth - Profundidad máxima del árbol (null para calcular automáticamente)
 * @param orientation - Orientación del árbol ('vertical' o 'horizontal')
 * @param initialN - Valor inicial de n (por defecto 3)
 * @returns Layout completo del árbol con nodos, aristas y metadatos
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```ts
 * const layout = generateLinearRecursionTree(
 *   { shifts: [1, 2], coefficients: [1, 1], n0: 1 },
 *   null,
 *   'vertical',
 *   5
 * );
 * ```
 */
export function generateLinearRecursionTree(
  recurrence: LinearRecurrenceData,
  maxDepth: number | null = null,
  orientation: "vertical" | "horizontal" = "vertical",
  initialN: number = 3, // Por defecto n=3 (profundidad más baja)
): TreeLayout {
  // Generar nodos
  const treeNodes = generateLinearTreeNodes(recurrence, maxDepth, initialN);

  // Generar edges
  const treeEdges = generateLinearTreeEdges(treeNodes);

  // Calcular posiciones
  const positionMap = calculateLinearTreePositions(
    treeNodes,
    initialN,
    orientation,
  );

  // Convertir a formato react-flow
  const sourcePos = orientation === "vertical" ? "bottom" : "right";
  const targetPos = orientation === "vertical" ? "top" : "left";

  // Calcular número de nodos por nivel
  const nodesByLevel = new Map<number, number>();
  const nodesByArgument = new Map<number, number>();

  for (const node of treeNodes) {
    nodesByLevel.set(node.level, (nodesByLevel.get(node.level) || 0) + 1);
    nodesByArgument.set(
      node.argument,
      (nodesByArgument.get(node.argument) || 0) + 1,
    );
  }

  const nodes = treeNodes.map((node) => ({
    id: node.id,
    type: "default",
    data: {
      label: node.label,
      size: node.argument,
      level: node.level,
      nodeCount: nodesByLevel.get(node.level) || 1,
      isBaseCase: node.isBaseCase,
      duplicateCount: node.duplicateCount,
      argument: node.argument,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    },
    position: positionMap.get(node.id) || { x: 0, y: 0 },
  }));

  // Calcular número de nodos duplicados (subproblemas repetidos)
  const duplicateNodes = Array.from(nodesByArgument.entries()).filter(
    ([_, count]) => count > 1,
  ).length;

  const metadata = {
    totalNodes: treeNodes.length,
    totalLevels: Math.max(...treeNodes.map((n) => n.level)) + 1,
    nodesPerLevel: Array.from(nodesByLevel.values()),
    duplicateNodes, // número de argumentos que aparecen múltiples veces
    growthType: "exponential" as const, // Para recurrencias lineales siempre es exponencial
  };

  return {
    nodes,
    edges: treeEdges,
    metadata,
  };
}
