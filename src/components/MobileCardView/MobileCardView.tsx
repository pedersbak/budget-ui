import React, { useState } from "react";
import type { NetworkNodeData, NetworkLinkData } from "../../types/network";

export interface MobileCardViewProps {
  /** The node currently in focus. */
  rootId: string;
  nodes: NetworkNodeData[];
  links: NetworkLinkData[];
  /** Called when the user taps a related node row — push to drill-down history. */
  onNavigate: (nodeId: string) => void;
  /** Called when the user taps "Vis graf" — switches to radial view. */
  onShowRadial: () => void;
  /** Optional action rendered in the focused-node header (e.g. AiReportButton). */
  actionSlot?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeColor(type: string): string {
  if (type === "person") return "#a78bfa";
  if (type === "company") return "#4f9cf9";
  return "#8892a4";
}

function typeBg(type: string): string {
  if (type === "person") return "rgba(167,139,250,0.12)";
  if (type === "company") return "rgba(79,156,249,0.12)";
  return "rgba(136,146,164,0.12)";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  rootId,
  nodes,
  links,
  onNavigate,
  onShowRadial,
  actionSlot,
}) => {
  const rootNode = nodes.find((n) => n.id === rootId);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!rootNode) return null;

  // Gather all links touching rootId, group by first relation label
  type RelatedEntry = { node: NetworkNodeData; linkId: string };
  const grouped = new Map<string, RelatedEntry[]>();

  for (const link of links) {
    const isSource = link.sourceId === rootId;
    const isTarget = link.targetId === rootId;
    if (!isSource && !isTarget) continue;

    const neighborId = isSource ? link.targetId : link.sourceId;
    const neighbor = nodes.find((n) => n.id === neighborId);
    if (!neighbor) continue;

    const label = (link.labels?.[0] ?? link.label ?? "RELATION").toUpperCase();
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label)!.push({ node: neighbor, linkId: link.id });
  }

  const toggle = (label: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", paddingBottom: "1.5rem" }}>
      {/* ------------------------------------------------------------------ */}
      {/* Focused node header                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          margin: "0.75rem 0.75rem 0",
          padding: "1rem",
          borderRadius: 12,
          background: "#161b27",
          border: "1px solid #1e2638",
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            textTransform: "uppercase",
            color: typeColor(rootNode.type),
            background: typeBg(rootNode.type),
            letterSpacing: "0.06em",
            marginBottom: 6,
          }}
        >
          {rootNode.type}
        </span>

        <div
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: "#e2e8f0",
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {rootNode.label}
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#4b5563",
            fontFamily: "monospace",
            marginBottom: 12,
          }}
        >
          {rootNode.id}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {actionSlot}
          <button
            onClick={onShowRadial}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 6,
              border: "1px solid #2a3347",
              background: "#0d1117",
              color: "#8892a4",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 11 }}>◎</span> Vis graf
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Relation groups                                                      */}
      {/* ------------------------------------------------------------------ */}
      {grouped.size === 0 ? (
        <div
          style={{
            padding: "2rem 1rem",
            textAlign: "center",
            color: "#4b5563",
            fontSize: 13,
          }}
        >
          Ingen relationer
        </div>
      ) : (
        <div
          style={{
            margin: "0.75rem 0.75rem 0",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {Array.from(grouped.entries()).map(([label, entries]) => {
            const isOpen = expanded.has(label);
            return (
              <div
                key={label}
                style={{
                  borderRadius: 10,
                  background: "#161b27",
                  border: "1px solid #1e2638",
                  overflow: "hidden",
                }}
              >
                {/* Section toggle */}
                <button
                  onClick={() => toggle(label)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#4f9cf9",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 10,
                        background: "#0d1117",
                        color: "#8892a4",
                        border: "1px solid #2a3347",
                      }}
                    >
                      {entries.length}
                    </span>
                    <span
                      style={{
                        color: "#4b5563",
                        fontSize: 14,
                        display: "inline-block",
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                      }}
                    >
                      ▾
                    </span>
                  </span>
                </button>

                {/* Node rows */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #1e2638" }}>
                    {entries.map((entry, idx) => (
                      <button
                        key={entry.linkId}
                        onClick={() => onNavigate(entry.node.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          background: "none",
                          border: "none",
                          borderBottom:
                            idx < entries.length - 1 ? "1px solid #1a2030" : "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 3,
                            textTransform: "uppercase",
                            color: typeColor(entry.node.type),
                            background: typeBg(entry.node.type),
                            letterSpacing: "0.05em",
                          }}
                        >
                          {entry.node.type}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            fontSize: 14,
                            color: "#e2e8f0",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.node.label}
                        </span>
                        <span style={{ flexShrink: 0, color: "#4b5563", fontSize: 16 }}>›</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
