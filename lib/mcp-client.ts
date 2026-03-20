import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

function normalizeServerUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.includes("/mcp") ? trimmed : `${trimmed}/api/mcp`;
}

export async function listMcpTools(
  serverUrl: string
): Promise<{ tools: unknown[]; error?: string }> {
  const mcpUrl = normalizeServerUrl(serverUrl);
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  const client = new Client(
    {
      name: "mcp-host-client",
      version: "1.0.0",
    },
    {}
  );

  try {
    await client.connect(transport);
    const result = await client.listTools();
    const tools = result.tools ?? [];
    client.close();
    return { tools };
  } catch (error) {
    try {
      client.close();
    } catch {
      /* ignore */
    }
    const message = error instanceof Error ? error.message : String(error);
    return { tools: [], error: message };
  }
}

export async function callMcpTool(
  serverUrl: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ content: unknown[]; error?: string }> {
  const mcpUrl = normalizeServerUrl(serverUrl);
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  const client = new Client(
    {
      name: "mcp-host-client",
      version: "1.0.0",
    },
    {}
  );

  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });
    client.close();
    const content = Array.isArray(result.content) ? result.content : [];
    return { content };
  } catch (error) {
    try {
      client.close();
    } catch {
      /* ignore */
    }
    const message = error instanceof Error ? error.message : String(error);
    return { content: [], error: message };
  }
}
