"use client";

import type { Flow } from "@/lib/flows";

interface FlowPanelProps {
  flows: Flow[];
  activeFlowId: string;
  onFlowSelect: (flowId: string) => void;
}

export default function FlowPanel({
  flows,
  activeFlowId,
  onFlowSelect,
}: FlowPanelProps) {
  if (flows.length === 0) {
    return (
      <div className="flow-panel">
        <div className="flow-panel-title">User Flows</div>
        <div
          style={{
            padding: "16px",
            color: "#444",
            fontSize: "11px",
            textAlign: "center",
          }}
        >
          No flows yet
        </div>
      </div>
    );
  }

  return (
    <div className="flow-panel">
      <div className="flow-panel-title">User Flows</div>
      {flows.map((flow) => (
        <div
          key={flow.id}
          className={`flow-item${flow.id === activeFlowId ? " active" : ""}`}
          onClick={() => onFlowSelect(flow.id)}
        >
          {flow.name}
        </div>
      ))}
    </div>
  );
}
