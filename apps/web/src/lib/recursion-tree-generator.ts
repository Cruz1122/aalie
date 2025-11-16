/**
 * Generador del árbol de recursión para visualización con react-flow
 */

export interface RecurrenceData {
  a: number; // número de subproblemas
  b: number; // factor de reducción
  f: string; // trabajo no recursivo f(n)
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
 * Calcula la profundidad máxima hasta el caso base
 */
function calculateBaseCaseDepth(recurrence: RecurrenceData, initialN: number = 30): number {
  let depth = 0;
  let currentN = initialN;
  
  while (currentN > recurrence.n0 && recurrence.b > 1) {
    currentN = currentN / recurrence.b;
    depth++;
  }
  
  return depth;
}

/**
 * Genera todos los nodos del árbol de recursión
 */
function generateTreeNodes(
  recurrence: RecurrenceData,
  maxDepth: number | null,
  initialN: number = 30
): TreeNode[] {
  const nodes: TreeNode[] = [];
  const baseCaseDepth = calculateBaseCaseDepth(recurrence, initialN);
  const effectiveMaxDepth = maxDepth !== null ? Math.min(maxDepth, baseCaseDepth) : baseCaseDepth;
  
  // Nodo raíz
  nodes.push({
    id: 'root',
    label: 'T(n)',
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
  
  // Debug: verificar nodos generados
  console.log('[generateTreeNodes] Generated nodes:', {
    total: nodes.length,
    byLevel: nodes.reduce((acc, n) => {
      acc[n.level] = (acc[n.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>),
    sampleIds: nodes.slice(0, 5).map(n => n.id)
  });
  
  return nodes;
}

/**
 * Genera las aristas (edges) del árbol con información del costo
 */
function generateTreeEdges(nodes: TreeNode[], recurrence: RecurrenceData): TreeEdge[] {
  const edges: TreeEdge[] = [];
  
  // Crear un mapa de nodos por ID para verificación
  const nodeMap = new Map<string, TreeNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }
  
  // Para cada nodo que no sea raíz, encontrar su padre
  for (const node of nodes) {
    if (node.level === 0) continue;
    
    // Calcular el índice del padre
    const parentLevel = node.level - 1;
    const nodeIndex = parseInt(node.id.split('-')[2] || '0');
    const parentIndex = Math.floor(nodeIndex / recurrence.a);
    
    const parentId = parentLevel === 0 ? 'root' : `node-${parentLevel}-${parentIndex}`;
    
    // Verificar que el padre existe
    if (!nodeMap.has(parentId)) {
      console.warn(`[generateTreeEdges] Parent node ${parentId} not found for node ${node.id}`);
      continue;
    }
    
    edges.push({
      id: `edge-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      // No especificar sourceHandle/targetHandle, usar los handles por defecto de los nodos
      style: {
        stroke: '#64748b',
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
  nodeWidth: number = 180,
  nodeHeight: number = 80,
  horizontalSpacing: number = 250,
  verticalSpacing: number = 150
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
  nodeWidth: number = 180,
  nodeHeight: number = 80,
  horizontalSpacing: number = 250,
  verticalSpacing: number = 150
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
  orientation: 'vertical' | 'horizontal' = 'vertical',
  initialN: number = 30
): TreeLayout {
  // Validaciones básicas
  if (recurrence.a <= 0 || recurrence.b <= 1) {
    throw new Error('Parámetros de recurrencia inválidos: a debe ser > 0 y b debe ser > 1');
  }
  
  // Generar nodos y edges
  const treeNodes = generateTreeNodes(recurrence, maxDepth, initialN);
  const treeEdges = generateTreeEdges(treeNodes, recurrence);
  
  // Calcular posiciones según orientación
  const positionMap = orientation === 'vertical'
    ? calculateVerticalPositions(treeNodes, recurrence)
    : calculateHorizontalPositions(treeNodes, recurrence);
  
  // Convertir a formato de react-flow
  // Nota: sourcePosition y targetPosition se pasarán como strings y se convertirán en Position en el componente
  const sourcePos = orientation === 'vertical' ? 'bottom' : 'right';
  const targetPos = orientation === 'vertical' ? 'top' : 'left';
  
  const nodes = treeNodes.map((node) => ({
    id: node.id,
    type: 'default',
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
    totalLevels: Math.max(...treeNodes.map(n => n.level)) + 1,
    nodesPerLevel: Array.from(nodesPerLevel.values()),
  };
  
  return {
    nodes,
    edges: treeEdges,
    metadata,
  };
}

