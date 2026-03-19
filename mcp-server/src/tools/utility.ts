import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResult } from "../lib/helpers.js";

const WIREFRAME_CSS = `/* Validator 3000 — Wireframe Base Styles */

/* Reset & base */
* { box-sizing: border-box; margin: 0; padding: 0; }
body, .screen { font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; background: #111; color: #aaa; }

/* Theme system */
:root {
  --v3k-bg: #111;
  --v3k-surface: #1a1a1a;
  --v3k-border: #333;
  --v3k-text: #aaa;
  --v3k-text-bright: #fff;
  --v3k-text-dim: #666;
  --v3k-accent: #4a9eff;
  --v3k-radius: 8px;
}

/* Box-drawing classes */
.box {
  border: 1px solid var(--v3k-border);
  border-radius: var(--v3k-radius);
  padding: 12px;
}
.box-filled {
  background: var(--v3k-surface);
  border: 1px solid var(--v3k-border);
  border-radius: var(--v3k-radius);
  padding: 12px;
}

/* Typography */
.title { color: var(--v3k-text-bright); font-size: 16px; font-weight: 600; }
.subtitle { color: var(--v3k-text-dim); font-size: 12px; }
.body-text { color: var(--v3k-text); font-size: 13px; line-height: 1.5; }
.caption { color: var(--v3k-text-dim); font-size: 11px; }

/* Layout helpers */
.stack { display: flex; flex-direction: column; }
.row { display: flex; flex-direction: row; align-items: center; }
.center { display: flex; align-items: center; justify-content: center; }
.spacer { flex: 1; }
.gap-4 { gap: 4px; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.gap-16 { gap: 16px; }

/* Interactive elements */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 8px 16px; border-radius: var(--v3k-radius);
  font-size: 13px; font-weight: 500; cursor: pointer;
  border: 1px solid var(--v3k-border); color: var(--v3k-text);
  background: var(--v3k-surface);
}
.btn-primary {
  background: var(--v3k-accent); color: #fff; border-color: var(--v3k-accent);
}

/* Input placeholder */
.input {
  background: var(--v3k-surface); border: 1px solid var(--v3k-border);
  border-radius: var(--v3k-radius); padding: 8px 12px;
  color: var(--v3k-text); font-size: 13px;
}

/* Separator */
.divider { height: 1px; background: var(--v3k-border); margin: 12px 0; }

/* Status bar spacer (mobile) */
.status-bar { height: 44px; }

/* Tab bar (mobile) */
.tab-bar {
  display: flex; justify-content: space-around; align-items: center;
  height: 56px; border-top: 1px solid var(--v3k-border);
  background: var(--v3k-surface);
}
.tab-item { color: var(--v3k-text-dim); font-size: 10px; text-align: center; }
.tab-item.active { color: var(--v3k-accent); }
`;

const SCREEN_TEMPLATE = `<div class="screen" style="display:flex; flex-direction:column; height:100%; padding:40px 24px 32px; color:#aaa; font-size:13px;">
  <div style="flex:1; display:flex; flex-direction:column;">
    <div style="height:60px"></div>
    <div style="color:#fff; font-size:16px; text-align:center;">Screen Title</div>
    <div style="color:#666; font-size:12px; text-align:center; margin-top:6px;">Subtitle text</div>
  </div>
</div>`;

export function registerUtilityTools(server: McpServer) {
  server.tool(
    "get_wireframe_styles",
    "Returns the base wireframe CSS that should be used when authoring screens. Use these classes and variables for consistent styling.",
    {},
    async () => {
      return textResult({ css: WIREFRAME_CSS });
    },
  );

  server.tool(
    "get_screen_template",
    "Returns a blank screen HTML template to use as a starting point when creating new screens.",
    {},
    async () => {
      return textResult({ html: SCREEN_TEMPLATE });
    },
  );
}
