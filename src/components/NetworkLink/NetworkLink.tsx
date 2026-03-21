import React from "react";
import { NetworkLinkData } from "../../types/network";

export interface NetworkLinkProps {
  link: NetworkLinkData;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  /** Called when the user clicks the overflow "(+N)" pill. */
  onMoreClick?: (labels: string[]) => void;
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
  const stroke = link.color ?? "#aab4c0";

  // Normalise: prefer the labels array, fall back to legacy label string
  const allLabels: string[] = link.labels?.length
    ? link.labels
    : link.label
    ? [link.label]
    : [];

  const firstLabel = allLabels[0];
  const extraCount = allLabels.length - 1;
  const hasMore = extraCount > 0;

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoreClick?.(allLabels);
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
        strokeLinecap="round"
      />

      {firstLabel && (
        <g style={{ pointerEvents: "all" }}>
          {/* Main label pill */}
          <rect
            x={midX - labelW / 2}
            y={midY - PILL_H / 2}
            width={labelW}
            height={PILL_H}
            rx={PILL_R}
            fill="white"
            stroke="#e0e3e8"
            strokeWidth={0.8}
            opacity={0.95}
          />
          <text
            x={midX}
            y={midY + FONT / 2 - 1}
            textAnchor="middle"
            fill="#555"
            fontSize={FONT}
            fontFamily="system-ui, sans-serif"
          >
            {firstLabel}
          </text>

          {/* Overflow pill — only shown when there are more relations */}
          {hasMore && (
            <g
              onClick={handleMoreClick}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={midX + labelW / 2 + 3}
                y={midY - PILL_H / 2}
                width={moreW}
                height={PILL_H}
                rx={PILL_R}
                fill="#e8f0fe"
                stroke="#4285f4"
                strokeWidth={0.8}
              />
              <text
                x={midX + labelW / 2 + 3 + moreW / 2}
                y={midY + FONT / 2 - 1}
                textAnchor="middle"
                fill="#4285f4"
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
