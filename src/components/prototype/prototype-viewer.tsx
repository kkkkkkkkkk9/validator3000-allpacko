"use client";

import { Suspense } from "react";
import type { Flow } from "@/lib/flows";
import type { Screen } from "@/lib/screens";
import PhoneFrame from "@/components/prototype/phone-frame";
import ScreenRenderer from "@/components/prototype/screen-renderer";
import FlowPanel from "@/components/prototype/flow-panel";
import TocPanel from "@/components/prototype/toc-panel";
import { usePrototypeNav } from "@/hooks/use-prototype-nav";
import { useRealtimeScreens } from "@/hooks/use-realtime-screens";

interface PrototypeViewerProps {
  flows: Flow[];
  screens: Screen[];
  activeFlowId: string;
  activeScreenId: string;
  productSlug: string;
  theme: string;
  organizationId: string;
  commentCounts: Record<string, number>;
}

function PrototypeViewerInner({
  flows,
  screens,
  activeFlowId,
  activeScreenId,
  productSlug,
  theme,
  organizationId,
  commentCounts,
}: PrototypeViewerProps) {
  const nav = usePrototypeNav({
    screens,
    flows,
    initialFlowId: activeFlowId,
    initialScreenId: activeScreenId,
    productSlug,
  });

  const realtimeUpdates = useRealtimeScreens(organizationId);

  const currentScreen = screens.find((s) => s.id === nav.activeScreenId);
  const htmlContent = currentScreen
    ? realtimeUpdates[currentScreen.id] ?? currentScreen.html_content
    : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "0px",
        minHeight: "calc(100dvh - 57px)",
        padding: "24px",
      }}
    >
      {/* Left: Flow Panel + TOC Panel */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <FlowPanel
          flows={flows}
          activeFlowId={nav.activeFlowId}
          onFlowSelect={nav.goToFlow}
        />
        <TocPanel
          screens={screens}
          activeScreenId={nav.activeScreenId}
          onScreenSelect={nav.goToScreen}
          commentCounts={commentCounts}
        />
      </div>

      {/* Center: Phone Frame */}
      <div style={{ margin: "0 32px" }}>
        <PhoneFrame>
          {currentScreen ? (
            <ScreenRenderer htmlContent={htmlContent} theme={theme} />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#444",
                fontFamily:
                  "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                fontSize: "12px",
              }}
            >
              No screen selected
            </div>
          )}
        </PhoneFrame>

        {/* Navigation controls beneath the phone */}
        {screens.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              marginTop: "16px",
              fontFamily:
                "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
              fontSize: "11px",
              color: "#555",
            }}
          >
            <button
              onClick={nav.prevScreen}
              disabled={nav.currentIndex <= 0}
              style={{
                background: "none",
                border: "1px solid #333",
                borderRadius: "6px",
                color: nav.currentIndex <= 0 ? "#222" : "#888",
                fontFamily: "inherit",
                fontSize: "11px",
                padding: "4px 12px",
                cursor: nav.currentIndex <= 0 ? "default" : "pointer",
              }}
            >
              Esc prev
            </button>
            <span>
              {nav.currentIndex + 1} / {nav.totalScreens}
            </span>
            <button
              onClick={nav.nextScreen}
              disabled={nav.currentIndex >= nav.totalScreens - 1}
              style={{
                background: "none",
                border: "1px solid #333",
                borderRadius: "6px",
                color:
                  nav.currentIndex >= nav.totalScreens - 1 ? "#222" : "#888",
                fontFamily: "inherit",
                fontSize: "11px",
                padding: "4px 12px",
                cursor:
                  nav.currentIndex >= nav.totalScreens - 1
                    ? "default"
                    : "pointer",
              }}
            >
              Enter next
            </button>
          </div>
        )}
      </div>

      {/* Right: Comments Panel placeholder */}
      <div className="comments-panel" style={{ maxHeight: "780px" }}>
        <div className="comments-header">Comments</div>
        <div className="comments-flow-label">
          {currentScreen?.name ?? "None"}
        </div>
        <div className="comments-list">
          <div
            style={{
              padding: "24px 16px",
              color: "#333",
              fontSize: "11px",
              textAlign: "center",
            }}
          >
            Comments coming soon
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps the inner viewer in Suspense because useSearchParams() requires it.
 */
export default function PrototypeViewer(props: PrototypeViewerProps) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100dvh - 57px)",
            color: "#444",
            fontFamily:
              "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: "12px",
          }}
        >
          Loading prototype...
        </div>
      }
    >
      <PrototypeViewerInner {...props} />
    </Suspense>
  );
}
