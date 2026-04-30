"use client";

import type { PedagogyIconName } from "@aa/content-catalog";
import Analytics from "@mui/icons-material/Analytics";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import Lightbulb from "@mui/icons-material/Lightbulb";
import School from "@mui/icons-material/School";
import Science from "@mui/icons-material/Science";
import Warning from "@mui/icons-material/Warning";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";

const ICON_COMPONENTS: Record<PedagogyIconName, ComponentType<SvgIconProps>> = {
  school: School,
  science: Science,
  analytics: Analytics,
  lightbulb: Lightbulb,
  warning: Warning,
  error_outline: ErrorOutline,
};

export interface MaterialIconProps extends SvgIconProps {
  name: PedagogyIconName;
}

export function MaterialIcon({
  name,
  fontSize = "small",
  ...rest
}: MaterialIconProps) {
  const Icon = ICON_COMPONENTS[name] ?? ICON_COMPONENTS.warning;
  return <Icon fontSize={fontSize} {...rest} />;
}
