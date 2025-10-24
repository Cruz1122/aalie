import {
  Network,
  Workflow,
  Server,
  GitBranch,
  AlertTriangle,
  Brain,
  FileDown,
  Package,
  Shield,
  Zap,
  Calculator,
  BarChart3,
  Code2,
  LucideIcon,
} from "lucide-react";

interface IconConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

// Configuración de íconos con colores consistentes
const ICON_CONFIG: Record<string, IconConfig> = {
  arquitectura: {
    icon: Network,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20 border-blue-500/30",
  },
  "ui-flujo": {
    icon: Workflow,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20 border-emerald-500/30",
  },
  "parse-analyze": {
    icon: Server,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20 border-orange-500/30",
  },
  "cfg-recursion": {
    icon: GitBranch,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20 border-purple-500/30",
  },
  errores: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/20 border-red-500/30",
  },
  llm: {
    icon: Brain,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20 border-cyan-500/30",
  },
  export: {
    icon: FileDown,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20 border-pink-500/30",
  },
  "monorepo-packages": {
    icon: Package,
    color: "text-indigo-400", 
    bgColor: "bg-indigo-500/20 border-indigo-500/30",
  },
  "code-quality": {
    icon: Shield,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20 border-teal-500/30",
  },
  "ui-showcase": {
    icon: Zap,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20 border-yellow-500/30",
  },
  "katex-integration": {
    icon: Calculator,
    color: "text-lime-400",
    bgColor: "bg-lime-500/20 border-lime-500/30",
  },
  "analyzer-interface": {
    icon: BarChart3,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20 border-violet-500/30",
  },
  "grammar-parser": {
    icon: Code2,
    color: "text-green-400",
    bgColor: "bg-green-500/20 border-green-500/30",
  },
};

interface DocumentationIconProps {
  sectionId: string;
  size?: number;
  className?: string;
}

export const DocumentationIcon = ({
  sectionId,
  size = 48,
  className = "",
}: DocumentationIconProps) => {
  const config = ICON_CONFIG[sectionId] || ICON_CONFIG["arquitectura"];
  const IconComponent = config.icon;

  return (
    <div
      className={`
        inline-flex items-center justify-center
        rounded-xl border transition-all duration-200
        hover:scale-110 hover:shadow-lg
        ${config.bgColor}
        ${className}
      `}
      style={{
        width: size + 24,
        height: size + 24,
      }}
    >
      <IconComponent size={size} className={`${config.color} drop-shadow-sm`} strokeWidth={1.5} />
    </div>
  );
};

// Función helper para obtener la configuración de color
export const getIconConfig = (sectionId: string) => {
  return ICON_CONFIG[sectionId] || ICON_CONFIG["arquitectura"];
};
