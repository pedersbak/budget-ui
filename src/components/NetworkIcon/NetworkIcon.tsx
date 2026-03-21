import React, { useEffect } from "react";

const ANIM_STYLE_ID = "iris-network-icon-keyframes";

function ensureKeyframes() {
  if (document.getElementById(ANIM_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = ANIM_STYLE_ID;
  style.textContent = `
    @keyframes iris-icon-orbit {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes iris-icon-pulse-ring {
      0%, 100% { opacity: 0.5; r: 5; }
      50%       { opacity: 1;   r: 6.5; }
    }
    @keyframes iris-icon-edge-fade {
      0%, 100% { opacity: 0.35; }
      50%       { opacity: 0.9; }
    }
  `;
  document.head.appendChild(style);
}

export interface NetworkIconProps {
  /** Width/height in pixels. Default 32. */
  size?: number;
  /** Enable the slow continuous animation. Default false. */
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A generic network-analysis icon: a central hub node with four
 * satellite nodes connected by edges. Suitable as a logo mark.
 */
export const NetworkIcon: React.FC<NetworkIconProps> = ({
  size = 32,
  animated = false,
  className,
  style,
}) => {
  useEffect(() => {
    if (animated) ensureKeyframes();
  }, [animated]);

  // The icon is drawn on a 40×40 viewBox.
  // Centre node at (20,20). Four satellites at N/E/S/W at radius 12.
  const cx = 20;
  const cy = 20;
  const R = 12; // orbit radius
  const satellites = [
    { id: "n",  angle: -90 },
    { id: "e",  angle:   0 },
    { id: "s",  angle:  90 },
    { id: "nw", angle: -145 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Network graph icon"
    >
      {/* Rotating group — only animates when animated=true */}
      <g
        style={
          animated
            ? {
                transformOrigin: "20px 20px",
                animation: "iris-icon-orbit 12s linear infinite",
              }
            : undefined
        }
      >
        {/* Edges from centre to each satellite */}
        {satellites.map((s) => {
          const rad = (s.angle * Math.PI) / 180;
          const x2 = cx + R * Math.cos(rad);
          const y2 = cy + R * Math.sin(rad);
          return (
            <line
              key={s.id}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="#4285f4"
              strokeWidth="1.6"
              strokeLinecap="round"
              style={
                animated
                  ? {
                      animation: `iris-icon-edge-fade 3s ease-in-out infinite`,
                      animationDelay: `${satellites.indexOf(s) * 0.4}s`,
                    }
                  : undefined
              }
            />
          );
        })}

        {/* Satellite nodes */}
        {satellites.map((s) => {
          const rad = (s.angle * Math.PI) / 180;
          const x = cx + R * Math.cos(rad);
          const y = cy + R * Math.sin(rad);
          const isCompany = s.id === "e" || s.id === "nw";
          return (
            <circle
              key={s.id}
              cx={x}
              cy={y}
              r={isCompany ? 4 : 3.2}
              fill={isCompany ? "#34a853" : "#4285f4"}
              style={
                animated
                  ? {
                      animation: `iris-icon-pulse-ring 3s ease-in-out infinite`,
                      animationDelay: `${satellites.indexOf(s) * 0.4}s`,
                    }
                  : undefined
              }
            />
          );
        })}
      </g>

      {/* Centre hub — not rotating */}
      <circle cx={cx} cy={cy} r={5.5} fill="#4285f4" />
      <circle cx={cx} cy={cy} r={3}   fill="white" />
    </svg>
  );
};
