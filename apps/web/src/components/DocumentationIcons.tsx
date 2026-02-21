import {
  Network,
  Workflow,
  GitBranch,
  AlertTriangle,
  Brain,
  Package,
  Shield,
  Code2,
  Cpu,
  Plug,
  Languages,
  LucideIcon,
} from "lucide-react";

interface IconConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const NEUTRAL_STYLE = {
  color: "text-slate-400",
  bgColor: "bg-slate-500/20 border-slate-500/30",
};

// Configuración de íconos con paleta neutra profesional (secciones consolidadas)
const ICON_CONFIG: Record<string, IconConfig> = {
  arquitectura: { icon: Network, ...NEUTRAL_STYLE },
  "flujo-ui": { icon: Workflow, ...NEUTRAL_STYLE },
  visualizaciones: { icon: GitBranch, ...NEUTRAL_STYLE },
  errores: { icon: AlertTriangle, ...NEUTRAL_STYLE },
  llm: { icon: Brain, ...NEUTRAL_STYLE },
  i18n: { icon: Languages, ...NEUTRAL_STYLE },
  monorepo: { icon: Package, ...NEUTRAL_STYLE },
  herramientas: { icon: Shield, ...NEUTRAL_STYLE },
  analisis: { icon: Cpu, ...NEUTRAL_STYLE },
  grammar: { icon: Code2, ...NEUTRAL_STYLE },
  mcp: { icon: Plug, ...NEUTRAL_STYLE },
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
      <IconComponent
        size={size}
        className={`${config.color} drop-shadow-sm`}
        strokeWidth={1.5}
      />
    </div>
  );
};

// Función helper para obtener la configuración de color
export const getIconConfig = (sectionId: string) => {
  return ICON_CONFIG[sectionId] || ICON_CONFIG["arquitectura"];
};
