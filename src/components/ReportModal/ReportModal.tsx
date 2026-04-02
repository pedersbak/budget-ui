import React from "react";

export interface ReportModalProps {
  title: string;
  markdown: string;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Minimal Markdown → React renderer (no external deps)
// Handles: # h1-3  **bold**  *italic*  - list  numbered list  | tables |
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#e2e8f0" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/** Parse a markdown table row into trimmed cell strings. */
function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((_, i, arr) => i > 0 && i < arr.length - 1); // strip leading/trailing empty
}

/** Return true if the line is a separator row like |---|---| */
function isTableSeparator(line: string): boolean {
  return /^\|[\s|:-]+\|$/.test(line.trim());
}

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let tableLines: string[] = [];
  let keyCounter = 0;
  const key = () => keyCounter++;

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key()} style={{ margin: "0.4rem 0 0.75rem 1.25rem", padding: 0, color: "#c9d1d9" }}>
        {listItems.map((item, j) => (
          <li key={j} style={{ marginBottom: 3, fontSize: 13, lineHeight: 1.65 }}>
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    // First line = header, then separator, then body rows
    const [headerLine, , ...bodyLines] = tableLines;
    const headers = parseTableRow(headerLine ?? "");
    const rows = bodyLines.map(parseTableRow);
    elements.push(
      <div
        key={key()}
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          margin: "0.5rem 0 1rem",
          borderRadius: 6,
          border: "1px solid #21262d",
        } as React.CSSProperties}
      >
        <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", minWidth: "max-content" }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#8892a4",
                    background: "#161b27",
                    borderBottom: "1px solid #21262d",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid #1a2030" }}>
                {cells.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: "6px 10px",
                      color: "#c9d1d9",
                      verticalAlign: "top",
                    }}
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableLines = [];
  };

  for (const line of lines) {
    const isTableLine = line.trim().startsWith("|") && line.trim().endsWith("|");

    if (isTableLine) {
      // Don't include separator rows in tableLines but keep them to know header/body boundary
      flushList();
      tableLines.push(line);
      continue;
    }

    // Non-table line — flush any pending table first
    if (tableLines.length > 0) flushTable();

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key()} style={{ margin: "1rem 0 0.35rem", fontSize: 14, fontWeight: 700, color: "#58a6ff" }}>
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={key()}
          style={{ margin: "1.25rem 0 0.5rem", fontSize: 16, fontWeight: 700, color: "#79c0ff", borderBottom: "1px solid #21262d", paddingBottom: 6 }}
        >
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={key()} style={{ margin: "0 0 1rem", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s+/, ""));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key()} style={{ margin: "0 0 0.75rem", fontSize: 14, lineHeight: 1.7, color: "#c9d1d9", overflowWrap: "break-word", wordBreak: "break-word" }}>
          {renderInline(line)}
        </p>
      );
    }
  }
  flushList();
  flushTable();
  return elements;
}

// ---------------------------------------------------------------------------

export const ReportModal: React.FC<ReportModalProps> = ({ title, markdown, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "100vw",
          maxHeight: "92dvh",
          background: "#0d1117",
          borderRadius: "16px 16px 0 0",
          border: "1px solid #21262d",
          borderBottom: "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          boxSizing: "border-box",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a3347" }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.6rem 1.25rem 0.85rem",
            borderBottom: "1px solid #21262d",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#e2e8f0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              marginRight: 12,
            }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #2a3347",
              borderRadius: 8,
              padding: "4px 12px",
              color: "#8892a4",
              cursor: "pointer",
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            Luk
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            padding: "1rem 1.25rem",
            // Extra bottom padding for iOS home indicator
            paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))",
            // Prevent any stray content from breaking out horizontally
            wordBreak: "break-word",
            overflowWrap: "break-word",
            maxWidth: "100%",
            boxSizing: "border-box",
          } as React.CSSProperties}
        >
          {renderMarkdown(markdown)}
        </div>
      </div>
    </div>
  );
};
