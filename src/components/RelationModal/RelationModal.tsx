import React, { useEffect } from "react";

export interface RelationModalProps {
  labels: string[];
  onClose: () => void;
}

/**
 * A simple overlay modal listing all relation labels between two nodes.
 */
export const RelationModal: React.FC<RelationModalProps> = ({ labels, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#161b27",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          border: "1px solid #1e2638",
          padding: "1.5rem",
          minWidth: 280,
          maxWidth: 480,
          width: "90%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#e2e8f0" }}>
            Relations ({labels.length})
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#8892a4",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {labels.map((label, i) => (
            <li
              key={i}
              style={{
                padding: "7px 12px",
                borderRadius: 6,
                background: i % 2 === 0 ? "#0d1117" : "#161b27",
                fontSize: 13,
                color: "#e2e8f0",
                border: "1px solid #2a3347",
              }}
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
