import React, { useEffect, useRef } from "react";

export interface AiReportButtonProps {
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const STYLE_ID = "netvrk-ai-btn-styles";

const css = `
@keyframes nai-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(79,156,249,0.0), inset 0 0 0 0 rgba(79,156,249,0.0); }
  50%       { box-shadow: 0 0 8px 2px rgba(79,156,249,0.25), inset 0 0 6px 0 rgba(79,156,249,0.08); }
}
@keyframes nai-scan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
@keyframes nai-dot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
  40%           { opacity: 1;   transform: scale(1); }
}
.nai-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.nai-btn-idle {
  background: linear-gradient(135deg, #0d1117 0%, #0e1e3d 100%);
  border: 1px solid #2a4a7f;
  color: #6ba8f5;
}
.nai-btn-idle:hover:not(:disabled) {
  border-color: #4f9cf9;
  color: #a8cfff;
  background: linear-gradient(135deg, #0e1e3d 0%, #132a55 100%);
}
.nai-btn-loading {
  background: linear-gradient(135deg, #0a0f1a 0%, #0e1e3d 100%);
  border: 1px solid #3a6ea8;
  color: #4f9cf9;
  animation: nai-pulse 1.6s ease-in-out infinite;
  cursor: default;
}
.nai-scan {
  position: absolute;
  top: 0; left: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(79,156,249,0.18), transparent);
  animation: nai-scan 1.4s linear infinite;
  pointer-events: none;
}
.nai-dots { display: inline-flex; gap: 2px; align-items: center; }
.nai-dots span {
  display: inline-block;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: currentColor;
  animation: nai-dot 1.2s ease-in-out infinite;
}
.nai-dots span:nth-child(2) { animation-delay: 0.2s; }
.nai-dots span:nth-child(3) { animation-delay: 0.4s; }
`;

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = css;
  document.head.appendChild(el);
}

export const AiReportButton: React.FC<AiReportButtonProps> = ({ loading, onClick, disabled }) => {
  const injected = useRef(false);
  if (!injected.current) { injectStyles(); injected.current = true; }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`nai-btn ${loading ? "nai-btn-loading" : "nai-btn-idle"}`}
      title="Generér AI-rapport"
    >
      {loading && <span className="nai-scan" />}
      <span style={{ fontSize: 12, lineHeight: 1 }}>{loading ? "⬡" : "✦"}</span>
      {loading ? (
        <>
          Tænker
          <span className="nai-dots">
            <span /><span /><span />
          </span>
        </>
      ) : (
        "Spørg Netvrk AI"
      )}
    </button>
  );
};
