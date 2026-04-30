"use client";

import type { TermIndexEntry } from "@aa/content-catalog/types";
import { Link } from "@/i18n/navigation";
import { MaterialIcon } from "./MaterialIcon";
import { Tooltip, Box, Typography, Link as MuiLink } from "@mui/material";
import React from "react";

interface TermInlineProps {
  text: string;
  term: {
    label: string;
    definition: string;
  };
  display?: "tooltip" | "highlight";
  href?: string;
}

export function TermInline({ text, term, display, href }: TermInlineProps) {
  const resolvedClassName =
    display === "highlight"
      ? "rounded bg-sky-400/15 px-1 py-0.5 text-sky-100 font-medium"
      : "border-b border-dashed border-sky-400/60 text-sky-100 cursor-help transition-colors hover:border-sky-400/90 hover:bg-sky-400/5 px-0.5";

  const tooltipContent = (
    <Box sx={{ p: 1.5, maxWidth: 280 }}>
      <Typography variant="subtitle2" component="div" sx={{ fontWeight: 600, color: "white", mb: 0.5 }}>
        {term.label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.85rem", lineHeight: 1.6 }}>
        {term.definition}
      </Typography>
      {href && (
        <Box sx={{ mt: 1.5, pt: 1, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <MuiLink
            component={Link}
            href={href}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: "0.75rem",
              color: "#7dd3fc",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" }
            }}
          >
            Ver explicación detallada
            <MaterialIcon name="arrow_forward" style={{ fontSize: 14 }} />
          </MuiLink>
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="top"
      enterTouchDelay={0}
      leaveTouchDelay={3000}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "#0f172a",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
            p: 0
          }
        },
        arrow: {
          sx: {
            color: "#0f172a",
            "&::before": {
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }
          }
        }
      }}
    >
      <span className={resolvedClassName}>
        {text}
      </span>
    </Tooltip>
  );
}
