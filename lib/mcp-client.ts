import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { approvedUrl, mcpFetch, serverHeaders } from "./server-config";

async function withClient<T>(
  url: string,
  signal: AbortSignal,
  run: (client: Client) => Promise<T>,
) {
  const endpoint = approvedUrl(url);
  const client = new Client({ name: "mcp-host-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
    fetch: mcpFetch(AbortSignal.any([signal, AbortSignal.timeout(15_000)])),
    requestInit: { headers: serverHeaders(endpoint) },
  });
  try {
    await client.connect(transport);
    return await run(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}
export function listMcpTools(url: string, signal: AbortSignal) {
  return withClient(url, signal, async (client) => {
    const tools = [];
    let cursor: string | undefined;
    do {
      const page = await client.listTools({ cursor });
      tools.push(...page.tools);
      cursor = page.nextCursor;
      if (tools.length > 200) throw new Error("Demasiadas herramientas.");
    } while (cursor);
    return { tools };
  });
}
export function callMcpTool(
  url: string,
  name: string,
  args: Record<string, unknown>,
  signal: AbortSignal,
) {
  return withClient(url, signal, async (client) => {
    const result = await client.callTool({ name, arguments: args });
    return {
      content: Array.isArray(result.content) ? result.content : [],
      structuredContent: result.structuredContent,
      isError: result.isError === true,
    };
  });
}
