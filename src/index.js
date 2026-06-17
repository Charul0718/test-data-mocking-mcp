import express from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "test-data-mocking-mcp", time: new Date().toISOString() });
});

// Stateless mode: a fresh server + transport per request. This keeps the
// service safe to run as multiple Railway instances with no shared session
// state — each call is self-contained, which is all six tools here need.
app.post("/mcp", async (req, res) => {
  try {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: req.body?.id ?? null,
      });
    }
  }
});

// GET/DELETE aren't used in stateless mode but the spec expects a response
// rather than a connection reset, so return 405 explicitly.
app.get("/mcp", (_req, res) => res.status(405).json({ error: "Method not allowed in stateless mode." }));
app.delete("/mcp", (_req, res) => res.status(405).json({ error: "Method not allowed in stateless mode." }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`test-data-mocking-mcp listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint:  http://localhost:${PORT}/mcp`);
});
