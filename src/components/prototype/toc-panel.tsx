"use client";

import type { Screen } from "@/lib/screens";

interface TocPanelProps {
  screens: Screen[];
  activeScreenId: string;
  onScreenSelect: (screenId: string) => void;
  commentCounts: Record<string, number>;
}

export default function TocPanel({
  screens,
  activeScreenId,
  onScreenSelect,
  commentCounts,
}: TocPanelProps) {
  if (screens.length === 0) {
    return (
      <div className="toc-panel">
        <div className="toc-title">Table of Contents</div>
        <div
          style={{
            padding: "16px",
            color: "#444",
            fontSize: "11px",
            textAlign: "center",
          }}
        >
          No screens yet
        </div>
      </div>
    );
  }

  return (
    <div className="toc-panel">
      <div className="toc-title">Table of Contents</div>
      {screens.map((screen) => {
        const count = commentCounts[screen.id] ?? 0;
        return (
          <div
            key={screen.id}
            className={`toc-item${screen.id === activeScreenId ? " active" : ""}`}
            onClick={() => onScreenSelect(screen.id)}
          >
            <span>{screen.name}</span>
            {count > 0 && (
              <span className="toc-comment-count">({count})</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
