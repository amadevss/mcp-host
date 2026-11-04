#!/usr/bin/env node
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url =
  process.argv[2] ||
  process.env.MCP_LOCAL_URL ||
  "http://localhost:3000/api/mcp";
const client = new Client({ name: "mcp-host-test", version: "1.0.0" });
try {
  const headers = process.env.MCP_BEARER_TOKEN
    ? { Authorization: `Bearer ${process.env.MCP_BEARER_TOKEN}` }
    : {};
  await client.connect(
    new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers },
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          redirect: "error",
          signal: AbortSignal.timeout(10_000),
        }),
    }),
  );
  const { tools } = await client.listTools();
  console.log(
    "Herramientas:",
    tools.map((t) => t.name).join(", ") || "(ninguna)",
  );
  if (tools.some((t) => t.name === "echo")) {
    const result = await client.callTool({
      name: "echo",
      arguments: { message: "Hola MCP!" },
    });
    assert.notEqual(result.isError, true);
    assert.ok(JSON.stringify(result.content).includes("Hola MCP!"));
    console.log("echo: correcto");
  }
  if (tools.some((t) => t.name === "roll_dice")) {
    const result = await client.callTool({
      name: "roll_dice",
      arguments: { sides: 6 },
    });
    assert.notEqual(result.isError, true);
    assert.match(JSON.stringify(result.content), /[1-6] \(d6\)/);
    console.log("roll_dice: correcto");
  }
} catch (error) {
  console.error("Prueba MCP fallida:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
