import React, { useRef } from "react";

const STYLE_ID = "iris-ai-btn-styles";

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes iris-ai-shimmer {
      0%   { transform: translateX(-100%) skewX(-12deg); }
      100% { transform: translateX(350%)  skewX(-12deg); }
    }
    @keyframes iris-ai-pulse-border {
      0%, 100% { box-shadow: 0 0 0 0 rgba(79,156,249,0.0); }
      50%       { box-shadow: 0 0 0 3px rgba(79,156,249,0.18); }
    }
    @keyframes iris-ai-dot {
      0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); }
      40%            { opacity: 1;    transform: scale(1.1); }
    }
    .iris-ai-btn {
      position: relative;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s, box-shadow 0.2s;
    }
    .iris-ai-btn-idle {
      background: #0d1117;
      border: 1px solid #2a3a54;
      color: #4f9cf9;
    }
    .iris-ai-btn-idle:hover {
      border-color: #4f9cf9;
      background: #0e1e38;
      box-shadow: 0 0 0 2px rgba(79,156,249,0.12);
    }
    .iris-ai-btn-loading {
      background: linear-gradient(135deg, #0a0f1a 0%, #0d1e3a 100%);
      border: 1px solid #2a4a7f;
      color: #7ab8ff;
      cursor: default;
      animation: iris-ai-pulse-border 2s ease-in-out infinite;
    }
    .iris-ai-shimmer {
      position: absolute;
      top: 0; left: 0;
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(79,156,249,0.15) 50%,
        transparent 100%
      );
      animation: iris-ai-shimmer 1.6s ease-in-out infinite;
      pointer-events: none;
    }
    .iris-ai-dots {
      display: inline-flex;
      gap: 3px;
      align-items: center;
    }
    .iris-ai-dots span {
      display: inline-block;
      width: 3px; height: 3px;
      border-radius: 50%;
      background: currentColor;
      animation: iris-ai-dot 1.4s ease-in-out infinite;
    }
    .iris-ai-dots span:nth-child(2) { animation-delay: 0.2s; }
    .iris-ai-dots span:nth-child(3) { animation-delay: 0.4s; }
  `;
  document.head.appendChild(el);
}

export interface AiReportButtonProps {
  loading: boolean;
  onClick: () => void;
}

export const AiReportButton: React.FC<AiReportButtonProps> = ({ loading, onClick }) => {
  const injected = useRef(false);
  if (!injected.current) { injectStyles(); injected.current = true; }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`iris-ai-btn ${loading ? "iris-ai-btn-loading" : "iris-ai-btn-idle"}`}
    >
      {loading && <span className="iris-ai-shimmer" />}
      <span style={{ fontSize: 13, lineHeight: 1, position: "relative" }}>
        {loading ? "⬡" : "✦"}
      </span>
      {loading ? (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Tænker
          <span className="iris-ai-dots">
            <span /><span /><span />
          </span>
        </span>
      ) : (
        <span>AI Rapport</span>
      )}
    </button>
  );
};
