import React, { useEffect } from "react";

const SCROLL_STYLE_ID = "iris-report-scrollbar";

function injectScrollbarStyles() {
  if (typeof document === "undefined" || document.getElementById(SCROLL_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = SCROLL_STYLE_ID;
  el.textContent = `
    .iris-report-body::-webkit-scrollbar { width: 5px; }
    .iris-report-body::-webkit-scrollbar-track { background: transparent; }
    .iris-report-body::-webkit-scrollbar-thumb { background: #2a3347; border-radius: 99px; }
    .iris-report-body::-webkit-scrollbar-thumb:hover { background: #4f9cf9; }
    .iris-report-table::-webkit-scrollbar { height: 4px; }
    .iris-report-table::-webkit-scrollbar-track { background: transparent; }
    .iris-report-table::-webkit-scrollbar-thumb { background: #2a3347; border-radius: 99px; }
    .iris-report-table::-webkit-scrollbar-thumb:hover { background: #4f9cf9; }
  `;
  document.head.appendChild(el);
}

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
    const allHeaders = parseTableRow(headerLine ?? "");

    // Columns to suppress — too wide for mobile.
    // Normalise header: lowercase, collapse all whitespace variants to a
    // single space, then check startsWith so "Stemmeret %", "Stemmeret%" etc.
    // are all caught regardless of encoding.
    const HIDDEN_PREFIXES = ["stemmeret", "stemme", "organ"];
    const normalise = (h: string) =>
      h.toLowerCase().replace(/[\s\u00a0\u202f]+/g, " ").trim();
    const isHidden = (h: string) =>
      HIDDEN_PREFIXES.some((p) => normalise(h).startsWith(p));

    const visibleIdx = allHeaders
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => !isHidden(h))
      .map(({ i }) => i);

    const headers = visibleIdx.map((i) => allHeaders[i]);
    const allRows = bodyLines
      .filter((l) => l.trim() !== "" && !l.trim().match(/^[\s|:-]+$/))
      .map((line) => {
        const all = parseTableRow(line);
        return visibleIdx.map((i) => all[i] ?? "");
      });

    // If there's a "Periode til" column, sort current rows (d.d.) above historic.
    const periodeTilIdx = headers.findIndex((h) => normalise(h) === "periode til");
    let currentRows = allRows;
    let historicRows: string[][] = [];
    if (periodeTilIdx !== -1) {
      currentRows = allRows.filter((r) => (r[periodeTilIdx] ?? "").trim().toLowerCase() === "d.d.");
      historicRows = allRows.filter((r) => (r[periodeTilIdx] ?? "").trim().toLowerCase() !== "d.d.");
    }
    elements.push(
      <div
        key={key()}
        className="iris-report-table"
        style={{
          width: "100%",
          margin: "0.5rem 0 1rem",
          border: "1px solid #21262d",
          borderRadius: 6,
          boxSizing: "border-box",
          overflow: "hidden",
        } as React.CSSProperties}
      >
        <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", tableLayout: "fixed" }}>
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
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((cells: string[], ri: number) => (
              <tr key={`c-${ri}`} style={{ borderBottom: "1px solid #1a2030" }}>
                {cells.map((cell: string, ci: number) => (
                  <td key={ci} style={{ padding: "6px 10px", color: "#c9d1d9", verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 0 }}>
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
            {historicRows.length > 0 && currentRows.length > 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  style={{
                    padding: "5px 10px",
                    background: "#0d1117",
                    borderTop: "1px solid #2a3347",
                    borderBottom: "1px solid #2a3347",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: "#2a3347" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#7c6f3e", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      Historisk
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#2a3347" }} />
                  </div>
                </td>
              </tr>
            )}
            {historicRows.map((cells: string[], ri: number) => (
              <tr key={`h-${ri}`} style={{ borderBottom: "1px solid #1a2030" }}>
                {cells.map((cell: string, ci: number) => (
                  <td key={ci} style={{ padding: "6px 10px", color: "#a0aab8", verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 0 }}>
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
  useEffect(() => { injectScrollbarStyles(); }, []);

  // Detect desktop: viewports wider than 640px get a centered dialog instead
  // of the mobile bottom-sheet.
  const isDesktop = typeof window !== "undefined" && window.innerWidth > 640;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: isDesktop ? "center" : "flex-end",
        justifyContent: "center",
        padding: isDesktop ? "2rem" : 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isDesktop ? "min(90vw, 1100px)" : "100vw",
          maxHeight: isDesktop ? "85vh" : "92dvh",
          background: "#0d1117",
          borderRadius: isDesktop ? 12 : "16px 16px 0 0",
          border: "1px solid #21262d",
          borderBottom: isDesktop ? "1px solid #21262d" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: isDesktop
            ? "0 8px 48px rgba(0,0,0,0.7)"
            : "0 -8px 40px rgba(0,0,0,0.6)",
          boxSizing: "border-box",
        }}
      >
        {/* Drag handle — mobile only */}
        {!isDesktop && (
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a3347" }} />
          </div>
        )}

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
          className="iris-report-body"
          style={{
            flex: 1,
            minHeight: 0,
            // minWidth:0 overrides flex's default min-width:auto — without it
            // the flex child expands to fit content, making width:100% on the
            // table wrapper resolve to a value wider than the screen.
            minWidth: 0,
            width: "100%",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            padding: "1rem 1.25rem",
            paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))",
            boxSizing: "border-box",
          } as React.CSSProperties}
        >
          {renderMarkdown(markdown)}
        </div>
      </div>
    </div>
  );
};
