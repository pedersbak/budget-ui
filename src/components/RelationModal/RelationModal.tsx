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
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          padding: "1.5rem",
          minWidth: 280,
          maxWidth: 480,
          width: "90%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#1a1a1a" }}>
            Relations ({labels.length})
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#888",
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
                background: i % 2 === 0 ? "#f8f9fa" : "#fff",
                fontSize: 13,
                color: "#333",
                border: "1px solid #eee",
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
