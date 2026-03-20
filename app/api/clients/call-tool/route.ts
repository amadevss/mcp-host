import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, toolName, args } = body as {
      url?: string;
      toolName?: string;
      args?: Record<string, unknown>;
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL del servidor MCP es requerida" },
        { status: 400 }
      );
    }

    if (!toolName || typeof toolName !== "string") {
      return NextResponse.json(
        { error: "Nombre del tool es requerido" },
        { status: 400 }
      );
    }

    const { callMcpTool } = await import("@/lib/mcp-client");
    const result = await callMcpTool(
      url,
      toolName,
      typeof args === "object" && args !== null ? args : {}
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error, content: [] },
        { status: 502 }
      );
    }

    return NextResponse.json({ content: result.content });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message, content: [] },
      { status: 500 }
    );
  }
}
