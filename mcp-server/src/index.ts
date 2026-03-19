import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerProductTools } from "./tools/products.js";
import { registerFlowTools } from "./tools/flows.js";
import { registerScreenTools } from "./tools/screens.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerUtilityTools } from "./tools/utility.js";

const server = new McpServer({
  name: "validator3000",
  version: "0.1.0",
});

// Register all tools
registerProductTools(server);
registerFlowTools(server);
registerScreenTools(server);
registerCommentTools(server);
registerUtilityTools(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
