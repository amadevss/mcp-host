#!/usr/bin/env node
/**
 * Script para probar el servidor MCP local.
 * Uso: node scripts/test-mcp-client.mjs [url]
 * Por defecto usa http://localhost:3000/api/mcp
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = process.argv[2] || "http://localhost:3000/api/mcp";

async function main() {
  const url = baseUrl.includes("/mcp") ? baseUrl : `${baseUrl}/api/mcp`;
  const transport = new StreamableHTTPClientTransport(new URL(url));
  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    {}
  );

  console.log("Conectando a", url);
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log("\nTools disponibles:", tools?.length ?? 0);
  tools?.forEach((t) => console.log("  -", t.name, ":", t.description ?? ""));

  if (tools?.some((t) => t.name === "echo")) {
    console.log("\nProbando tool 'echo'...");
    const result = await client.callTool({
      name: "echo",
      arguments: { message: "Hola MCP!" },
    });
    console.log("Resultado:", result.content);
  }

  if (tools?.some((t) => t.name === "roll_dice")) {
    console.log("\nProbando tool 'roll_dice'...");
    const result = await client.callTool({
      name: "roll_dice",
      arguments: { sides: 6 },
    });
    console.log("Resultado:", result.content);
  }

  client.close();
  console.log("\nListo.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
