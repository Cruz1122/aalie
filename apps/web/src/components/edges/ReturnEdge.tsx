import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import React from "react";

type ReturnEdgeData = {
  returnValue?: string;
};

export default function ReturnEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Bottom,
  markerEnd,
  style,
  data,
  selected,
}: EdgeProps) {
  const returnValue =
    (data as ReturnEdgeData | undefined)?.returnValue?.trim() ?? "";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.6,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? "#34d399" : "#10b981",
          strokeWidth: 2.5,
          ...style,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + 16}px)`,
            pointerEvents: "none",
            color: "#6ee7b7",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
            background: "rgba(2, 6, 23, 0.88)",
            border: "1px solid rgba(16, 185, 129, 0.28)",
            borderRadius: 6,
            padding: "2px 6px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
            zIndex: 5,
          }}
        >
          <span style={{ paddingRight: 6 }}>↩</span>
          {returnValue}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
