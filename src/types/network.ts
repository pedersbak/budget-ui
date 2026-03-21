/**
 * Predefined node types. Additional custom strings are also accepted.
 */
export type NodeType = "person" | "company" | "device" | "server" | (string & {});

/**
 * Data describing a single node in the network graph.
 */
export interface NetworkNodeData {
  /** Unique identifier for the node. */
  id: string;
  /** Display label shown beneath the node icon. */
  label: string;
  /** Semantic type of the node (e.g. "person", "company"). Controls default colour and icon. */
  type: NodeType;
  /** Optional URL (PNG or SVG) for the node icon. Falls back to a type-based emoji. */
  icon?: string;
  /** Initial horizontal position in pixels from the left of the canvas. */
  x: number;
  /** Initial vertical position in pixels from the top of the canvas. */
  y: number;
}

/**
 * Data describing a directed link between two nodes.
 */
export interface NetworkLinkData {
  /** Unique identifier for the link. */
  id: string;
  /** ID of the source node. */
  sourceId: string;
  /** ID of the target node. */
  targetId: string;
  /** All relation labels for this link (used when multiple relations exist between the same pair). */
  labels?: string[];
  /** Optional label rendered at the midpoint of the link. Deprecated in favour of labels[]. */
  label?: string;
  /** Stroke colour of the line. Defaults to #aab4c0. */
  color?: string;
  /** Stroke width in pixels. Defaults to 2. */
  strokeWidth?: number;
}
