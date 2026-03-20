import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL del servidor MCP es requerida" },
        { status: 400 }
      );
    }

    const { listMcpTools } = await import("@/lib/mcp-client");
    const result = await listMcpTools(url);

    if (result.error) {
      return NextResponse.json(
        { error: result.error, tools: [] },
        { status: 502 }
      );
    }

    return NextResponse.json({ tools: result.tools });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message, tools: [] },
      { status: 500 }
    );
  }
}
