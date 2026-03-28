import React from "react";
import { NetworkLinkData, RelationEntry } from "../../types/network";

export interface NetworkLinkProps {
  link: NetworkLinkData;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  /** Called when the user clicks a label pill. Passes all relation entries for this link. */
  onMoreClick?: (relations: RelationEntry[]) => void;
}

export const NetworkLink: React.FC<NetworkLinkProps> = ({
  link,
  sourceX,
  sourceY,
  targetX,
  targetY,
  onMoreClick,
}) => {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const stroke = link.color ?? "#2a3347";

  // Build structured relation entries: prefer link.relations, fall back to labels/label strings
  const allRelations: RelationEntry[] = link.relations?.length
    ? link.relations
    : link.labels?.length
    ? link.labels.map((l) => ({ label: l, from: null, to: null }))
    : link.label
    ? [{ label: link.label, from: null, to: null }]
    : [];

  const firstLabel = allRelations[0]?.label;
  const extraCount = allRelations.length - 1;
  const hasMore = extraCount > 0;

  const handlePillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoreClick?.(allRelations);
  };

  const handlePillTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
    // Only fire if the touch didn't move (i.e. it's a tap, not a drag)
    onMoreClick?.(allRelations);
  };

  // Pill width constants
  const LABEL_PAD = 10;
  const PILL_H = 18;
  const PILL_R = 5;
  const FONT = 10;
  // Approximate character width for centering (SVG has no easy text-measure)
  const labelW = firstLabel ? Math.max(48, firstLabel.length * 6 + LABEL_PAD * 2) : 0;
  const moreW = 36;

  return (
    <g>
      <line
        x1={sourceX}
        y1={sourceY}
        x2={targetX}
        y2={targetY}
        stroke={stroke}
        strokeWidth={link.strokeWidth ?? 2}
        strokeDasharray={link.strokeDasharray}
        strokeLinecap="round"
      />

      {firstLabel && (
        <g
          onClick={handlePillClick}
          onTouchEnd={handlePillTouch}
          style={{ pointerEvents: "all", cursor: "pointer" }}
        >
          {/* Main label pill — always clickable */}
          <rect
            x={midX - labelW / 2}
            y={midY - PILL_H / 2}
            width={labelW}
            height={PILL_H}
            rx={PILL_R}
            fill="#1e2638"
            stroke="#2a3347"
            strokeWidth={0.8}
            opacity={0.95}
          />
          <text
            x={midX}
            y={midY + FONT / 2 - 1}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize={FONT}
            fontFamily="system-ui, sans-serif"
          >
            {firstLabel}
          </text>

          {/* Overflow pill — only shown when there are more relations */}
          {hasMore && (
            <g>
              <rect
                x={midX + labelW / 2 + 3}
                y={midY - PILL_H / 2}
                width={moreW}
                height={PILL_H}
                rx={PILL_R}
                fill="#0e1e3d"
                stroke="#4f9cf9"
                strokeWidth={0.8}
              />
              <text
                x={midX + labelW / 2 + 3 + moreW / 2}
                y={midY + FONT / 2 - 1}
                textAnchor="middle"
                fill="#4f9cf9"
                fontSize={FONT}
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
              >
                +{extraCount}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};
