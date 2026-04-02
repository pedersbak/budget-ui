import React, { useMemo } from "react";
import type { NetworkNodeData, NetworkLinkData } from "../../types/network";

export interface MobileRadialViewProps {
  rootId: string;
  nodes: NetworkNodeData[];
  links: NetworkLinkData[];
  onNavigate: (nodeId: string) => void;
  onBack: () => void;
}

const W = 380;
const H = 520;
const CX = W / 2;
const CY = H / 2 - 20;
const R1 = 110; // inner ring radius
const R2 = 200; // outer ring radius
const ROOT_R = 28;
const NODE_R = 20;
const OUTER_R = 14;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

interface RadialNode {
  node: NetworkNodeData;
  x: number;
  y: number;
  ring: 0 | 1 | 2;
  parentId: string | null;
  historic: boolean;
  linkLabel: string;
}

function buildRadialLayout(
  rootId: string,
  nodes: NetworkNodeData[],
  links: NetworkLinkData[]
): RadialNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const root = nodeMap.get(rootId);
  if (!root) return [];

  const result: RadialNode[] = [];

  // Collect direct neighbours
  const ring1: { node: NetworkNodeData; historic: boolean; label: string }[] = [];
  for (const link of links) {
    const otherId =
      link.sourceId === rootId ? link.targetId :
      link.targetId === rootId ? link.sourceId : null;
    if (!otherId) continue;
    const other = nodeMap.get(otherId);
    if (!other) continue;
    const label = link.labels?.[0] ?? link.label ?? "";
    ring1.push({ node: other, historic: !!link.strokeDasharray, label });
  }

  // Root node
  result.push({ node: root, x: CX, y: CY, ring: 0, parentId: null, historic: false, linkLabel: "" });

  if (ring1.length === 0) return result;

  // Place ring 1 nodes evenly around the root
  const r1AngleStep = 360 / ring1.length;
  ring1.forEach(({ node, historic, label }, i) => {
    const angle = i * r1AngleStep;
    const { x, y } = polarToXY(CX, CY, R1, angle);
    result.push({ node, x, y, ring: 1, parentId: rootId, historic, linkLabel: label });

    // Collect ring-2 neighbours of this ring-1 node (excluding root and already-placed ring-1 nodes)
    const ring1Ids = new Set(ring1.map((r) => r.node.id));
    ring1Ids.add(rootId);

    const ring2: { node: NetworkNodeData; historic: boolean; label: string }[] = [];
    for (const link of links) {
      const otherId =
        link.sourceId === node.id ? link.targetId :
        link.targetId === node.id ? link.sourceId : null;
      if (!otherId || ring1Ids.has(otherId)) continue;
      const other = nodeMap.get(otherId);
      if (!other) continue;
      if (ring2.find((r) => r.node.id === otherId)) continue;
      const lbl = link.labels?.[0] ?? link.label ?? "";
      ring2.push({ node: other, historic: !!link.strokeDasharray, label: lbl });
    }

    // Spread ring-2 nodes in a small arc around the ring-1 parent
    if (ring2.length > 0) {
      const arcSpread = Math.min(60, 50 * ring2.length);
      const startAngle = angle - arcSpread / 2;
      const step = ring2.length > 1 ? arcSpread / (ring2.length - 1) : 0;
      ring2.forEach((r2, j) => {
        const a2 = startAngle + j * step;
        const pos = polarToXY(CX, CY, R2, a2);
        result.push({ node: r2.node, x: pos.x, y: pos.y, ring: 2, parentId: node.id, historic: r2.historic, linkLabel: r2.label });
      });
    }
  });

  return result;
}

export const MobileRadialView: React.FC<MobileRadialViewProps> = ({
  rootId,
  nodes,
  links,
  onNavigate,
  onBack,
}) => {
  const radialNodes = useMemo(
    () => buildRadialLayout(rootId, nodes, links),
    [rootId, nodes, links]
  );

  const posMap = new Map(radialNodes.map((rn) => [rn.node.id, rn]));

  // Determine viewport scale to fit on screen
  const vbW = W;
  const vbH = H + 60; // extra for back button area

  return (
    <div style={containerStyle}>
      {/* Back button */}
      <button style={backBtnStyle} onClick={onBack}>
        ← Tilbage til liste
      </button>

      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={{ width: "100%", flex: 1, display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Draw edges */}
        {radialNodes.filter((rn) => rn.parentId !== null).map((rn) => {
          const parent = posMap.get(rn.parentId!);
          if (!parent) return null;
          return (
            <line
              key={`edge-${rn.node.id}`}
              x1={parent.x} y1={parent.y}
              x2={rn.x} y2={rn.y}
              stroke={rn.historic ? "#7c6f3e" : "#2a3347"}
              strokeWidth={rn.ring === 2 ? 1 : 1.5}
              strokeDasharray={rn.historic ? "5 4" : undefined}
            />
          );
        })}

        {/* Draw link labels on ring-1 edges */}
        {radialNodes.filter((rn) => rn.ring === 1 && rn.linkLabel).map((rn) => {
          const parent = posMap.get(rn.parentId!);
          if (!parent) return null;
          const mx = (parent.x + rn.x) / 2;
          const my = (parent.y + rn.y) / 2;
          return (
            <text
              key={`lbl-${rn.node.id}`}
              x={mx} y={my - 4}
              textAnchor="middle"
              fontSize={8}
              fill="#4f9cf9"
              style={{ pointerEvents: "none" }}
            >
              {truncate(rn.linkLabel, 14)}
            </text>
          );
        })}

        {/* Draw nodes */}
        {radialNodes.map((rn) => {
          const r = rn.ring === 0 ? ROOT_R : rn.ring === 1 ? NODE_R : OUTER_R;
          const isCompany = rn.node.type === "company";
          const fill = rn.ring === 0 ? "#1a3a6b" : isCompany ? "#0e1e3d" : "#1e1a08";
          const stroke = rn.ring === 0 ? "#4f9cf9" : isCompany ? "#2a4a7f" : "#6b5a1e";
          const textColor = rn.ring === 0 ? "#e2e8f0" : isCompany ? "#93c5fd" : "#f6c90e";
          const maxChars = rn.ring === 0 ? 16 : rn.ring === 1 ? 12 : 9;
          const fontSize = rn.ring === 0 ? 8 : rn.ring === 1 ? 7.5 : 6.5;
          const words = truncate(rn.node.label, maxChars * 2).split(" ");
          // Split into up to 2 lines
          const mid = Math.ceil(words.length / 2);
          const line1 = words.slice(0, mid).join(" ");
          const line2 = words.slice(mid).join(" ");

          return (
            <g
              key={rn.node.id}
              onClick={() => rn.ring !== 0 && onNavigate(rn.node.id)}
              style={{ cursor: rn.ring !== 0 ? "pointer" : "default" }}
            >
              <circle
                cx={rn.x} cy={rn.y} r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={rn.ring === 0 ? 2 : 1.5}
              />
              {/* Type dot for non-root */}
              {rn.ring > 0 && (
                <circle
                  cx={rn.x + r * 0.6} cy={rn.y - r * 0.6}
                  r={rn.ring === 1 ? 4 : 3}
                  fill={isCompany ? "#4f9cf9" : "#f6c90e"}
                />
              )}
              <text
                x={rn.x}
                y={line2 ? rn.y - fontSize * 0.5 : rn.y + fontSize * 0.4}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight={rn.ring === 0 ? 700 : 600}
                fill={textColor}
                style={{ pointerEvents: "none" }}
              >
                {truncate(line1, maxChars)}
              </text>
              {line2 && (
                <text
                  x={rn.x}
                  y={rn.y + fontSize * 1.3}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight={rn.ring === 0 ? 700 : 600}
                  fill={textColor}
                  style={{ pointerEvents: "none" }}
                >
                  {truncate(line2, maxChars)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={legendStyle}>
        <span style={{ color: "#4f9cf9" }}>● Virksomhed</span>
        <span style={{ color: "#f6c90e" }}>● Person</span>
        <span style={{ color: "#7c6f3e" }}>- - Historisk</span>
        <span style={{ color: "#8892a4", fontSize: 10 }}>Tryk en node for at udforske</span>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "#0d1117",
  overflow: "hidden",
};

const backBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 16px",
  background: "none",
  border: "none",
  borderBottom: "1px solid #1e2638",
  color: "#4f9cf9",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
  textAlign: "left",
};

const legendStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "8px 16px",
  fontSize: 11,
  flexWrap: "wrap",
  borderTop: "1px solid #1e2638",
  flexShrink: 0,
};
