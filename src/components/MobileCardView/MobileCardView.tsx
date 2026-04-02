import React, { useState, useMemo } from "react";
import type { NetworkNodeData, NetworkLinkData } from "../../types/network";

export interface MobileCardViewProps {
  rootId: string;
  nodes: NetworkNodeData[];
  links: NetworkLinkData[];
  onNavigate: (nodeId: string) => void;
  onShowRadial: () => void;
  /** Slot for the AI report button — rendered next to the entity header */
  actionSlot?: React.ReactNode;
}

interface RelGroup {
  label: string;
  entries: { node: NetworkNodeData; historic: boolean }[];
}

function groupRelations(
  nodeId: string,
  nodes: NetworkNodeData[],
  links: NetworkLinkData[]
): RelGroup[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const groupMap = new Map<string, { node: NetworkNodeData; historic: boolean }[]>();

  for (const link of links) {
    const otherId =
      link.sourceId === nodeId ? link.targetId :
      link.targetId === nodeId ? link.sourceId : null;
    if (!otherId) continue;
    const other = nodeMap.get(otherId);
    if (!other) continue;

    const historic = !!link.strokeDasharray; // dashed = historic
    const rawLabels: string[] = link.labels?.length
      ? link.labels
      : link.label ? [link.label] : [];
    const labelKeys = rawLabels.length > 0 ? rawLabels : ["Tilknyttet"];

    for (const lbl of labelKeys) {
      if (!groupMap.has(lbl)) groupMap.set(lbl, []);
      // Avoid duplicates
      if (!groupMap.get(lbl)!.find((e) => e.node.id === otherId)) {
        groupMap.get(lbl)!.push({ node: other, historic });
      }
    }
  }

  return Array.from(groupMap.entries())
    .map(([label, entries]) => ({ label, entries }))
    .sort((a, b) => a.label.localeCompare(b.label, "da"));
}

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  rootId,
  nodes,
  links,
  onNavigate,
  onShowRadial,
  actionSlot,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const rootNode = nodes.find((n) => n.id === rootId);
  const groups = useMemo(
    () => groupRelations(rootId, nodes, links),
    [rootId, nodes, links]
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  if (!rootNode) return null;

  const totalRelations = groups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <div style={styles.container}>

      {/* Entity header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.entityName}>{rootNode.label}</div>
          <div style={styles.entityMeta}>
            <span style={{
              ...styles.typeBadge,
              background: rootNode.type === "person" ? "#2a2310" : "#0e1e3d",
              color: rootNode.type === "person" ? "#f6c90e" : "#4f9cf9",
            }}>
              {rootNode.type === "person" ? "Person" : "Virksomhed"}
            </span>
            <span style={styles.entityId}>{rootNode.id}</span>
          </div>
          <div style={styles.relationCount}>{totalRelations} relationer</div>
        </div>
        <div style={styles.headerActions}>
          {actionSlot}
          <button style={styles.radialBtn} onClick={onShowRadial} title="Vis som netværk">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="4"  r="2" />
              <circle cx="20" cy="8"  r="2" />
              <circle cx="20" cy="16" r="2" />
              <circle cx="12" cy="20" r="2" />
              <circle cx="4"  cy="16" r="2" />
              <circle cx="4"  cy="8"  r="2" />
              <line x1="12" y1="9"  x2="12" y2="6"  />
              <line x1="12" y1="9"  x2="18" y2="10" />
              <line x1="12" y1="15" x2="18" y2="14" />
              <line x1="12" y1="15" x2="12" y2="18" />
              <line x1="12" y1="15" x2="6"  y2="14" />
              <line x1="12" y1="9"  x2="6"  y2="10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Relation groups */}
      <div style={styles.groupList}>
        {groups.length === 0 && (
          <div style={styles.empty}>Ingen relationer fundet</div>
        )}
        {groups.map((group) => {
          const isOpen = expandedGroups.has(group.label);
          return (
            <div key={group.label} style={styles.group}>
              {/* Group header */}
              <button
                style={styles.groupHeader}
                onClick={() => toggleGroup(group.label)}
              >
                <div style={styles.groupHeaderLeft}>
                  <span style={styles.groupLabel}>{group.label}</span>
                  <span style={styles.groupCount}>{group.entries.length}</span>
                </div>
                <span style={{ color: "#4f9cf9", fontSize: 13, flexShrink: 0 }}>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>

              {/* Entries */}
              {isOpen && (
                <div style={styles.entryList}>
                  {group.entries.map(({ node, historic }) => (
                    <button
                      key={node.id}
                      style={styles.entryCard}
                      onClick={() => onNavigate(node.id)}
                    >
                      <div style={styles.entryLeft}>
                        <span style={{
                          ...styles.entryTypeDot,
                          background: node.type === "person" ? "#f6c90e" : "#4f9cf9",
                        }} />
                        <span style={styles.entryName}>{node.label}</span>
                        {historic && (
                          <span style={styles.historicBadge}>Historisk</span>
                        )}
                      </div>
                      <span style={styles.entryChevron}>›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto",
    background: "#0d1117",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "16px 16px 12px",
    borderBottom: "1px solid #1e2638",
    background: "#161b27",
    flexShrink: 0,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  entityName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#e2e8f0",
    marginBottom: 6,
    lineHeight: 1.3,
  },
  entityMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    padding: "2px 8px",
    borderRadius: 4,
  },
  entityId: {
    fontSize: 11,
    color: "#8892a4",
    fontFamily: "monospace",
  },
  relationCount: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 2,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    marginLeft: 12,
  },
  radialBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #2a3347",
    background: "#0d1117",
    color: "#4f9cf9",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    flexShrink: 0,
  },
  groupList: {
    flex: 1,
    padding: "8px 0",
  },
  group: {
    borderBottom: "1px solid #1e2638",
  },
  groupHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
  },
  groupHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#c5cdd6",
  },
  groupCount: {
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
    background: "#1e2638",
    borderRadius: 10,
    padding: "1px 7px",
    minWidth: 20,
    textAlign: "center" as const,
  },
  entryList: {
    padding: "0 12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  entryCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #1e2638",
    background: "#0d1117",
    cursor: "pointer",
    textAlign: "left" as const,
  },
  entryLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  entryTypeDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  entryName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#e2e8f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  historicBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "#a89450",
    background: "#1e1a0d",
    border: "1px solid #7c6f3e",
    borderRadius: 4,
    padding: "1px 6px",
    flexShrink: 0,
  },
  entryChevron: {
    fontSize: 18,
    color: "#4b5563",
    flexShrink: 0,
    marginLeft: 8,
  },
  empty: {
    padding: "32px 16px",
    textAlign: "center",
    color: "#4b5563",
    fontSize: 13,
  },
};
