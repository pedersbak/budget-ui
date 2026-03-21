import React, { useState, useRef, useCallback } from "react";
import { NetworkNodeData, NetworkLinkData } from "../../types/network";
import { NetworkNode, NODE_SIZE } from "../NetworkNode/NetworkNode";
import { NetworkLink } from "../NetworkLink/NetworkLink";
import { RelationModal } from "../RelationModal/RelationModal";

export interface NetworkGraphProps {
  /** Initial node configurations. Positions are taken from x/y and managed internally after mount. */
  nodes: NetworkNodeData[];
  /** Link definitions. Updated automatically when nodes are moved. */
  links: NetworkLinkData[];
  /** Canvas width. Accepts any valid CSS width value. Defaults to "100%". */
  width?: number | string;
  /** Canvas height in pixels or any CSS height value. Defaults to 600. */
  height?: number | string;
  /** Called when a node is clicked (not dragged). */
  onNodeClick?: (node: NetworkNodeData) => void;
  /**
   * ID of the node to highlight as the primary/focus node with a pulse animation.
   * Opt-in: has no effect unless set.
   */
  primaryNodeId?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * NetworkGraph is the main canvas component for rendering an interactive network.
 *
 * It maintains the positions of all nodes in local state, renders an SVG layer
 * for links behind an HTML layer for nodes, and handles drag-to-move via
 * pointer events tracked on the container.
 */
export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes: initialNodes,
  links,
  width = "100%",
  height = 600,
  onNodeClick,
  primaryNodeId,
  style,
  className,
}) => {
  // Node positions are seeded from props and owned by this component.
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() =>
    Object.fromEntries(initialNodes.map((n) => [n.id, { x: n.x, y: n.y }]))
  );

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [modalLabels, setModalLabels] = useState<string[] | null>(null);

  // Track whether the pointer moved enough to count as a drag (suppress click).
  const didDragRef = useRef(false);
  const DRAG_THRESHOLD = 4; // px

  // Use a ref for drag state so mousemove handler always has the latest values
  // without needing positions in its dependency array.
  const dragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      didDragRef.current = false;
      // Capture the position at the moment the drag starts.
      setPositions((prev) => {
        const pos = prev[nodeId];
        dragRef.current = {
          nodeId,
          startX: pos.x,
          startY: pos.y,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
        };
        return prev; // no state change here; purely for reading latest value
      });
      setDraggingNodeId(nodeId);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const { nodeId, startX, startY, startMouseX, startMouseY } =
        dragRef.current;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        didDragRef.current = true;
      }
      setPositions((prev) => ({
        ...prev,
        [nodeId]: { x: startX + dx, y: startY + dy },
      }));
    },
    []
  );

  const stopDragging = useCallback(() => {
    dragRef.current = null;
    setDraggingNodeId(null);
  }, []);

  // Merge current positions into the node data for rendering.
  const nodes = initialNodes.map((n) => ({ ...n, ...positions[n.id] }));

  // Half of NODE_SIZE — the offset to find the centre of the icon circle.
  const half = NODE_SIZE / 2;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        cursor: draggingNodeId ? "grabbing" : "default",
        ...style,
      }}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
    >
      {/* SVG layer — rendered first so it sits behind the node divs */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {links.map((link) => {
          const source = positions[link.sourceId];
          const target = positions[link.targetId];
          if (!source || !target) return null;
          return (
            <NetworkLink
              key={link.id}
              link={link}
              sourceX={source.x + half}
              sourceY={source.y + half}
              targetX={target.x + half}
              targetY={target.y + half}
              onMoreClick={setModalLabels}
            />
          );
        })}
      </svg>

      {/* Node layer – primary and dragged node sit on top via zIndex in NetworkNode */}
      {nodes.map((node) => (
        <NetworkNode
          key={node.id}
          node={node}
          isDragging={draggingNodeId === node.id}
          isPrimary={primaryNodeId !== undefined && node.id === primaryNodeId}
          onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
          onClick={(n) => { if (!didDragRef.current) onNodeClick?.(n); }}
        />
      ))}

      {/* Relation detail modal */}
      {modalLabels && (
        <RelationModal
          labels={modalLabels}
          onClose={() => setModalLabels(null)}
        />
      )}
    </div>
  );
};
