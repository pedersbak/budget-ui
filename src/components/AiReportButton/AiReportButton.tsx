import React from "react";

export interface AiReportButtonProps {
  loading: boolean;
  onClick: () => void;
}

export const AiReportButton: React.FC<AiReportButtonProps> = ({ loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 11px",
      borderRadius: 6,
      border: "1px solid #2a3347",
      background: loading ? "#161b27" : "#0d1117",
      color: loading ? "#4b5563" : "#4f9cf9",
      cursor: loading ? "default" : "pointer",
      fontSize: 12,
      fontWeight: 600,
      flexShrink: 0,
      transition: "border-color 0.15s, color 0.15s",
    }}
  >
    <span style={{ fontSize: 13, lineHeight: 1 }}>{loading ? "⏳" : "✨"}</span>
    {loading ? "Henter…" : "AI Rapport"}
  </button>
);
