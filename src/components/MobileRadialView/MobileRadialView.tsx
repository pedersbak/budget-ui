import React, { useMemo } from "react";
import type { NetworkNodeData, NetworkLinkData } from "../../types/network";

export interface MobileRadialViewProps {
  /** The node to place at the center. */
  rootId: string;
  nodes: NetworkNodeData[];
  links: NetworkLinkData[];
  /** Called when the user taps a node — navigate to it in card view. */
  onNavigate: (nodeId: string) => void;
  /** Called when the user taps the back button — return to card view. */
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const CX = 190;       // SVG center x
const CY = 200;       // SVG center y
const INNER_R = 100;  // depth-1 ring radius
const OUTER_R = 178;  // depth-2 ring radius
const MAX_D2 = 28;    // cap outer-ring nodes to keep it readable
// Extra space reserved around nodes for labels.
// SVG text doesn't affect layout bounding box, so we must over-estimate.
// ~9 chars × ~7px/char per depth-2 label = ~63px; add circle radius + offset.
const LABEL_PAD = 90;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nodeStroke(type: string): string {
  if (type === "person") return "#a78bfa";
  if (type === "company") return "#4f9cf9";
  return "#8892a4";
}

function nodeFill(type: string): string {
  if (type === "person") return "#1e1535";
  if (type === "company") return "#0d1f38";
  return "#181f2e";
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/** Text anchor for a node based on its x position relative to center. */
function anchor(x: number): "start" | "end" | "middle" {
  const dx = x - CX;
  if (dx > 18) return "start";
  if (dx < -18) return "end";
  return "middle";
}

/** Offset the label away from the center so it doesn't overlap the circle. */
function labelOffset(
  nx: number,
  ny: number,
  r: number
): { dx: number; dy: number } {
  const dx = nx - CX;
  const dy = ny - CY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return { dx: 0, dy: r + 13 };
  const scale = (r + 9) / len;
  return { dx: dx * scale, dy: dy * scale + 4 };
}

// ---------------------------------------------------------------------------
// Layout computation
// ---------------------------------------------------------------------------

interface NodePos {
  id: string;
  x: number;
  y: number;
  r: number;
  depth: number;
  type: string;
  label: string;
}

interface EdgePos {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  historic: boolean;
}

function buildLayout(
  rootId: string,
  nodes: NetworkNodeData[],
  links: NetworkLinkData[]
): { positions: Map<string, NodePos>; edges: EdgePos[]; viewBox: string } {
  // BFS: assign depth & first-seen parent
  const depths = new Map<string, number>([[rootId, 0]]);
  const parents = new Map<string, string>(); // depth-2 → depth-1 parent id
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const d = depths.get(curr)!;
    if (d >= 2) continue;

    for (const link of links) {
      const neighbor =
        link.sourceId === curr
          ? link.targetId
          : link.targetId === curr
          ? link.sourceId
          : null;
      if (neighbor === null || depths.has(neighbor)) continue;
      depths.set(neighbor, d + 1);
      if (d === 1) parents.set(neighbor, curr);
      queue.push(neighbor);
    }
  }

  const d1Nodes = nodes.filter((n) => depths.get(n.id) === 1);
  const d2Nodes = nodes
    .filter((n) => depths.get(n.id) === 2)
    .slice(0, MAX_D2);

  // Depth-1 angles — evenly distributed, starting at top (−π/2)
  const d1Angles = new Map<string, number>();
  d1Nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / d1Nodes.length - Math.PI / 2;
    d1Angles.set(n.id, angle);
  });

  // Depth-2: group by parent, then sub-arc around parent's angle
  const d2ByParent = new Map<string, NetworkNodeData[]>();
  d2Nodes.forEach((n) => {
    const parentId = parents.get(n.id);
    if (!parentId) return;
    if (!d2ByParent.has(parentId)) d2ByParent.set(parentId, []);
    d2ByParent.get(parentId)!.push(n);
  });

  // Build positions map
  const positions = new Map<string, NodePos>();

  // Root
  const rootNode = nodes.find((n) => n.id === rootId);
  if (rootNode) {
    positions.set(rootId, {
      id: rootId,
      x: CX,
      y: CY,
      r: 26,
      depth: 0,
      type: rootNode.type,
      label: rootNode.label,
    });
  }

  // Depth-1
  d1Nodes.forEach((n) => {
    const angle = d1Angles.get(n.id)!;
    positions.set(n.id, {
      id: n.id,
      x: CX + INNER_R * Math.cos(angle),
      y: CY + INNER_R * Math.sin(angle),
      r: 17,
      depth: 1,
      type: n.type,
      label: n.label,
    });
  });

  // Depth-2: sub-arc per parent
  d2ByParent.forEach((children, parentId) => {
    const parentAngle = d1Angles.get(parentId) ?? 0;
    // Adaptive spread: more children → wider arc, but cap at ~110°
    const spread = Math.min((Math.PI * 110) / 180, (children.length * Math.PI) / 8);
    children.forEach((child, j) => {
      const offset =
        children.length > 1
          ? (j / (children.length - 1) - 0.5) * spread
          : 0;
      const angle = parentAngle + offset;
      positions.set(child.id, {
        id: child.id,
        x: CX + OUTER_R * Math.cos(angle),
        y: CY + OUTER_R * Math.sin(angle),
        r: 12,
        depth: 2,
        type: child.type,
        label: child.label,
      });
    });
  });

  // Edges — only between positioned nodes
  const edges: EdgePos[] = links
    .filter((l) => positions.has(l.sourceId) && positions.has(l.targetId))
    .map((l) => ({
      id: l.id,
      x1: positions.get(l.sourceId)!.x,
      y1: positions.get(l.sourceId)!.y,
      x2: positions.get(l.targetId)!.x,
      y2: positions.get(l.targetId)!.y,
      // Historic edges are typically colored gold
      historic: l.color === "#a89450",
    }));

  // Compute a tight viewBox so nothing ever clips on any screen size
  let minX = CX, maxX = CX, minY = CY, maxY = CY;
  positions.forEach((p) => {
    minX = Math.min(minX, p.x - p.r - LABEL_PAD);
    maxX = Math.max(maxX, p.x + p.r + LABEL_PAD);
    minY = Math.min(minY, p.y - p.r - LABEL_PAD);
    maxY = Math.max(maxY, p.y + p.r + LABEL_PAD);
  });
  const vbPad = 12;
  const vbX = minX - vbPad;
  const vbY = minY - vbPad;
  const vbW = maxX - minX + vbPad * 2;
  const vbH = maxY - minY + vbPad * 2;
  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

  return { positions, edges, viewBox };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MobileRadialView: React.FC<MobileRadialViewProps> = ({
  rootId,
  nodes,
  links,
  onNavigate,
  onBack,
}) => {
  const { positions, edges, viewBox } = useMemo(
    () => buildLayout(rootId, nodes, links),
    [rootId, nodes, links]
  );

  const posArray = Array.from(positions.values());

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        background: "#0d1117",
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
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
          width: "100%",
        }}
      >
        ← Kortvisning
      </button>

      {/* Relative-positioned flex remainder — SVG fills it absolutely so it
          always fits within the available space with no clipping. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox={viewBox}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            touchAction: "manipulation",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
        {/* Guide circles (dashed rings) */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R}
          fill="none"
          stroke="#1e2638"
          strokeWidth={1}
          strokeDasharray="4 5"
        />
        <circle
          cx={CX}
          cy={CY}
          r={OUTER_R}
          fill="none"
          stroke="#1e2638"
          strokeWidth={1}
          strokeDasharray="4 5"
        />

        {/* Edges — rendered behind nodes */}
        {edges.map((e) => (
          <line
            key={e.id}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={e.historic ? "#a89450" : "#2a3347"}
            strokeWidth={1}
            strokeOpacity={0.75}
          />
        ))}

        {/* Nodes */}
        {posArray.map((p) => {
          const color = nodeStroke(p.type);
          const fill = nodeFill(p.type);
          const lo = labelOffset(p.x, p.y, p.r);
          const ta = anchor(p.x);
          const maxChars = p.depth === 0 ? 16 : p.depth === 1 ? 11 : 9;
          const fontSize = p.depth === 0 ? 11 : p.depth === 1 ? 9 : 7.5;
          const iconSize = p.depth === 0 ? 12 : p.depth === 1 ? 9 : 7;
          const isClickable = p.depth > 0;

          return (
            <g
              key={p.id}
              onClick={() => isClickable && onNavigate(p.id)}
              style={{ cursor: isClickable ? "pointer" : "default" }}
            >
              {/* Outer tap target (invisible, larger hit area on mobile) */}
              {isClickable && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.r + 8}
                  fill="transparent"
                  stroke="none"
                />
              )}

              {/* Node circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={fill}
                stroke={color}
                strokeWidth={p.depth === 0 ? 2.5 : 1.5}
              />

              {/* Type letter inside circle */}
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={iconSize}
                fontWeight={700}
                fill={color}
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {p.type === "person" ? "P" : "C"}
              </text>

              {/* Node label outside circle */}
              <text
                x={p.x + lo.dx}
                y={p.y + lo.dy}
                textAnchor={ta}
                fontSize={fontSize}
                fontWeight={p.depth === 0 ? 700 : 400}
                fill={p.depth === 0 ? "#e2e8f0" : p.depth === 1 ? "#c9d1d9" : "#8892a4"}
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {truncate(p.label, maxChars)}
              </text>
            </g>
          );
        })}
        </svg>
      </div>
    </div>
  );
};
