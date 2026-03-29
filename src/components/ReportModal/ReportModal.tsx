import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export interface ReportModalProps {
  title: string;
  markdown: string;
  onClose: () => void;
}

/** Minimal Markdown → HTML renderer for the subset used in CVR reports. */
function renderMarkdown(md: string): string {
  // 1. Escape HTML
  let s = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Tables — process each block of consecutive "|" lines as one unit
  s = s.replace(/((?:^[ \t]*\|.+\n?)+)/gm, (block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"));
    let header: string[] | null = null;
    const body: string[][] = [];
    let seenSep = false;

    for (const line of lines) {
      const inner = line.startsWith("|") && line.endsWith("|") ? line.slice(1, -1) : line.slice(1);
      const cells = inner.split("|").map((c) => c.trim());
      if (cells.every((c) => /^[-: ]+$/.test(c))) { seenSep = true; continue; }
      if (!seenSep) { header = cells; }
      else { body.push(cells); }
    }

    const thead = header
      ? `<thead><tr>${header.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`
      : "";
    const tbody = body.length
      ? `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`
      : "";
    return `<table class="rm-table">${thead}${tbody}</table>\n`;
  });

  // 3. Headings
  s = s
    .replace(/^### (.+)$/gm, '<h3 class="rm-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="rm-h2">$1</h2>')
    .replace(/^([^|*\n<].{2,80}):$/gm, '<h4 class="rm-h4">$1:</h4>');

  // 4. Bold
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 5. Bullet lists
  s = s
    .replace(/^\* (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/gs, (m) => `<ul class="rm-ul">${m}</ul>`);

  // 6. Paragraphs — wrap loose text blocks
  s = s
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (/^<(h[234]|table|ul|p)/.test(t)) return t;
      return `<p class="rm-p">${t.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");

  return s;
}

export const ReportModal: React.FC<ReportModalProps> = ({ title, markdown, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const html = renderMarkdown(markdown);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 2000,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#161b27",
          borderRadius: 14,
          border: "1px solid #1e2638",
          boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
          width: "100%",
          maxWidth: 780,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "1rem 1.25rem",
          borderBottom: "1px solid #1e2638",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>📋</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{title}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none",
              fontSize: 20, cursor: "pointer",
              color: "#8892a4", lineHeight: 1, padding: "0 4px",
            }}
          >×</button>
        </div>

        {/* Scrollable body */}
        <div
          className="rm-body"
          style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <style>{`
        .rm-h2 { font-size: 15px; font-weight: 700; color: #e2e8f0; margin: 1.2rem 0 0.5rem; }
        .rm-h3 { font-size: 13px; font-weight: 700; color: #4f9cf9; text-transform: uppercase;
                 letter-spacing: 0.06em; margin: 1.2rem 0 0.5rem; }
        .rm-h4 { font-size: 13px; font-weight: 700; color: #e2e8f0; margin: 1.1rem 0 0.4rem; }
        .rm-p  { font-size: 13px; color: #b0bac9; line-height: 1.65; margin: 0 0 0.75rem; }
        .rm-ul { margin: 0 0 0.75rem 1.2rem; padding: 0; }
        .rm-ul li { font-size: 13px; color: #b0bac9; line-height: 1.6; margin-bottom: 3px; }
        .rm-table { width: 100%; border-collapse: collapse; margin: 0 0 1rem; font-size: 12px; }
        .rm-table th { background: #0d1117; color: #8892a4; font-weight: 600;
                       padding: 6px 10px; text-align: left; border-bottom: 1px solid #2a3347;
                       white-space: nowrap; }
        .rm-table td { color: #c5cdd6; padding: 5px 10px; border-bottom: 1px solid #1e2638; }
        .rm-table tr:last-child td { border-bottom: none; }
        .rm-table tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        .rm-body::-webkit-scrollbar { width: 6px; }
        .rm-body::-webkit-scrollbar-track { background: transparent; }
        .rm-body::-webkit-scrollbar-thumb { background: #2a3347; border-radius: 3px; }
        .rm-body::-webkit-scrollbar-thumb:hover { background: #3a4a66; }
        .rm-body { scrollbar-width: thin; scrollbar-color: #2a3347 transparent; }
      `}</style>
    </div>,
    document.body
  );
};
