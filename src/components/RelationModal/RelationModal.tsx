import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import type { RelationEntry } from "../../types/network";

export interface RelationModalProps {
  relations: RelationEntry[];
  onClose: () => void;
}

function formatDate(d: string | null): string {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * A modal listing all relation entries between two nodes, with validity dates.
 */
export const RelationModal: React.FC<RelationModalProps> = ({ relations, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isActive = (r: RelationEntry) => !r.to || new Date(r.to) > new Date();

  return createPortal(
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
          minWidth: 300,
          maxWidth: 480,
          width: "90%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#e2e8f0" }}>
            Relations ({relations.length})
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
          {relations.map((rel, i) => {
            const active = isActive(rel);
            return (
              <li
                key={i}
                style={{
                  padding: "9px 12px",
                  borderRadius: 6,
                  background: i % 2 === 0 ? "#0d1117" : "#161b27",
                  border: "1px solid #2a3347",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{rel.label}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: active ? "rgba(79,156,249,0.12)" : "rgba(124,111,62,0.18)",
                      color: active ? "#4f9cf9" : "#a89450",
                      border: `1px solid ${active ? "rgba(79,156,249,0.3)" : "rgba(124,111,62,0.35)"}`,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {active ? "Aktiv" : "Historisk"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#8892a4" }}>
                  <span>
                    <span style={{ marginRight: 3, opacity: 0.6 }}>Fra</span>
                    <span style={{ color: "#b0bac9" }}>{formatDate(rel.from)}</span>
                  </span>
                  <span>
                    <span style={{ marginRight: 3, opacity: 0.6 }}>Til</span>
                    <span style={{ color: active ? "#b0bac9" : "#a89450" }}>
                      {active && !rel.to ? "Nu" : formatDate(rel.to)}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body
  );
};
