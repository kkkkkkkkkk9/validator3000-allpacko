# Validator 3000 MCP Server

MCP (Model Context Protocol) server for Validator 3000 — a wireframing platform. This server exposes tools for managing products, flows, screens, and comments via the stdio transport.

## Setup

### 1. Install & Build

```bash
cd mcp-server
npm install
npm run build
```

### 2. Configure Environment

Copy `.env` and fill in your organization ID:

```
SUPABASE_URL=https://gnrcfritpuismshocsdh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
V3K_ORG_ID=your-org-uuid
```

### 3. Add to Claude Code

Add this to your Claude Code MCP configuration (`.claude/settings.json` or project settings):

```json
{
  "mcpServers": {
    "validator3000": {
      "command": "node",
      "args": ["/path/to/validator3000/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://gnrcfritpuismshocsdh.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-key",
        "V3K_ORG_ID": "your-org-uuid"
      }
    }
  }
}
```

Replace `/path/to/validator3000` with the actual absolute path and fill in your credentials.

## Available Tools

### Products
- **list_products** — List all products in the organization
- **create_product** — Create a new product (name, description, theme)
- **update_product** — Update product settings
- **delete_product** — Soft-delete a product

### Flows
- **list_flows** — List flows for a product
- **create_flow** — Create a new flow
- **update_flow** — Update flow name
- **delete_flow** — Soft-delete a flow
- **reorder_flows** — Set sort order for flows

### Screens
- **list_screens** — List screens in a flow
- **get_screen** — Get full screen details including HTML content
- **create_screen** — Create a new screen with optional HTML content
- **update_screen** — Update screen (the key tool for editing wireframes)
- **delete_screen** — Soft-delete a screen
- **reorder_screens** — Set sort order for screens

### Comments
- **list_comments** — List comments for a screen with author names
- **add_comment** — Add a comment to a screen
- **delete_comment** — Delete a comment

### Utility
- **get_wireframe_styles** — Returns the base wireframe CSS classes and variables
- **get_screen_template** — Returns a blank screen HTML template

## Development

```bash
npm run dev    # Watch mode (recompiles on changes)
npm run build  # One-time build
npm start      # Run the server
```
