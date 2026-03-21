import React, { useEffect } from "react";
import { NetworkNodeData } from "../../types/network";

/** Width and height of the circular icon area in pixels. Exported so NetworkGraph can compute link anchor points. */
export const NODE_SIZE = 48;

const PULSE_STYLE_ID = "iris-node-pulse-keyframes";

function ensurePulseKeyframes() {
  if (document.getElementById(PULSE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PULSE_STYLE_ID;
  style.textContent = `
    @keyframes iris-node-pulse {
      0%   { transform: scale(1);    box-shadow: 0 0 0 0px rgba(66,133,244,0.25); }
      50%  { transform: scale(1.13); box-shadow: 0 0 0 8px rgba(66,133,244,0.08); }
      100% { transform: scale(1);    box-shadow: 0 0 0 0px rgba(66,133,244,0.0);  }
    }
  `;
  document.head.appendChild(style);
}

function getDefaultIcon(type: string): string {
  switch (type) {
    case "person":
      return "👤";
    case "company":
      return "🏢";
    case "device":
      return "💻";
    case "server":
      return "🖥️";
    default:
      return "⬡";
  }
}

function getNodeColors(type: string): { bg: string; border: string } {
  switch (type) {
    case "person":
      return { bg: "#e8f0fe", border: "#4285f4" };
    case "company":
      return { bg: "#e6f4ea", border: "#34a853" };
    case "device":
      return { bg: "#fce8e6", border: "#ea4335" };
    case "server":
      return { bg: "#fff3e0", border: "#fb8c00" };
    default:
      return { bg: "#f3e8fd", border: "#9c27b0" };
  }
}

export interface NetworkNodeProps {
  node: NetworkNodeData;
  /** Whether this node is currently being dragged by the user. */
  isDragging?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Called when the node is clicked (not dragged). */
  onClick?: (node: NetworkNodeData) => void;
  /**
   * When true the node slowly pulses to indicate it is the primary/focus node.
   * Requires the consuming app to opt in — false by default.
   */
  isPrimary?: boolean;
}

/**
 * NetworkNode renders a single draggable node in a network graph.
 *
 * It is intended to be rendered inside a `NetworkGraph` which manages
 * positions and wires up the drag handlers. It can also be composed
 * standalone if needed.
 */
export const NetworkNode: React.FC<NetworkNodeProps> = ({
  node,
  isDragging = false,
  onMouseDown,
  onClick,
  isPrimary = false,
}) => {
  const { bg, border } = getNodeColors(node.type);

  useEffect(() => {
    if (isPrimary) ensurePulseKeyframes();
  }, [isPrimary]);

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: NODE_SIZE,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        zIndex: isDragging ? 20 : isPrimary ? 10 : 1,
        transform: isDragging ? "scale(1.07)" : "scale(1)",
        transition: isDragging ? "none" : "transform 0.1s ease",
      }}
      onMouseDown={onMouseDown}
      onClick={() => onClick?.(node)}
    >
      {/* Icon circle */}
      <div
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: "50%",
          backgroundColor: bg,
          border: `2.5px solid ${border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: isDragging
            ? "0 6px 16px rgba(0,0,0,0.22)"
            : "0 2px 6px rgba(0,0,0,0.1)",
          transition: isDragging ? "none" : "box-shadow 0.1s ease",
          ...(isPrimary && !isDragging
            ? { animation: "iris-node-pulse 2.8s ease-in-out infinite" }
            : {}),
        }}
      >
        {node.icon ? (
          <img
            src={node.icon}
            alt={node.type}
            draggable={false}
            style={{
              width: "62%",
              height: "62%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        ) : (
          <span style={{ fontSize: 18, pointerEvents: "none" }}>
            {getDefaultIcon(node.type)}
          </span>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#1a1a1a",
          textAlign: "center",
          maxWidth: NODE_SIZE + 32,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {node.label}
      </span>

      {/* Type badge */}
      <span
        style={{
          fontSize: 8,
          color: border,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
        }}
      >
        {node.type}
      </span>
    </div>
  );
};
