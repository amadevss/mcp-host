import { NextResponse } from "next/server.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerTools } from "@/lib/mcp-tools";
import { secretMatches } from "@/lib/server-config";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handler(request: Request) {
  const token = process.env.MCP_BEARER_TOKEN;
  if (
    token &&
    !secretMatches(request.headers.get("authorization"), `Bearer ${token}`)
  ) {
    return NextResponse.json(
      { error: "Token MCP requerido." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }
  if (request.method !== "POST") {
    return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
  }

  // Use the Web Standard transport directly. The Node HTTP adapter replaces global
  // Request/Response constructors, which interferes with Next.js route handlers.
  const server = new McpServer({ name: "mcp-host-server", version: "1.0.0" });
  registerTools(server);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    // Complete the JSON response before closing this stateless connection.
    const body = response.body ? await response.arrayBuffer() : null;
    return new NextResponse(body, {
      status: response.status,
      headers: response.headers,
    });
  } finally {
    await server.close();
  }
}

export { handler as GET, handler as POST, handler as DELETE };
